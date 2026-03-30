const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const User = require('../../models').User;
const Prescription = require('../../models').Prescription;
const OrderItem = require('../../models').OrderItem;
const Medication = require('../../models').Medication;
const Pharmacy = require('../../models').Pharmacy;
const Order = require('../../models').Order;
const { AppError } = require('../../utils/AppError');
const { sendPushNotification } = require('../../config/firebase');
const { sendEmail } = require('../../utils/email');
const { paginate, paginateMeta } = require('../../utils/pagination');
const { uploadToCloudinary } = require('../../utils/upload');

const SAFE_USER = { exclude: ['password', 'refreshToken', 'passwordResetToken'] };

// ─── MEDICATIONS CRUD (Pharmacist) ────────────────────────
const addMedication = async (pharmacistUserId, data, fileBuffer) => {
  const pharmacy = await Pharmacy.findOne({ where: { userId: pharmacistUserId } });
  if (!pharmacy) throw new AppError('Pharmacy profile not found', 404);

  let imageUrl;
  if (fileBuffer) {
    const result = await uploadToCloudinary(fileBuffer, 'healthcare/medications');
    imageUrl = result.secure_url;
  }

  return Medication.create({ ...data, pharmacyId: pharmacy.id, ...(imageUrl && { imageUrl }) });
};

const updateMedication = async (pharmacistUserId, medicationId, updates) => {
  const pharmacy = await Pharmacy.findOne({ where: { userId: pharmacistUserId } });
  if (!pharmacy) throw new AppError('Pharmacy not found', 404);

  const med = await Medication.findOne({ where: { id: medicationId, pharmacyId: pharmacy.id } });
  if (!med) throw new AppError('Medication not found', 404);

  await med.update(updates);
  return med;
};

const deleteMedication = async (pharmacistUserId, medicationId) => {
  const pharmacy = await Pharmacy.findOne({ where: { userId: pharmacistUserId } });
  if (!pharmacy) throw new AppError('Pharmacy not found', 404);
  const med = await Medication.findOne({ where: { id: medicationId, pharmacyId: pharmacy.id } });
  if (!med) throw new AppError('Medication not found', 404);
  await med.destroy();
};

// ─── SEARCH Medications (Public) ─────────────────────────
const searchMedications = async (query) => {
  const { page, limit, offset } = paginate(query);
  const { search, category, pharmacyId, requiresPrescription, maxPrice } = query;

  const where = { isActive: true };
  if (search) where[Op.or] = [
    { name: { [Op.iLike]: `%${search}%` } },
    { genericName: { [Op.iLike]: `%${search}%` } },
    { brand: { [Op.iLike]: `%${search}%` } },
  ];
  if (category) where.category = { [Op.iLike]: `%${category}%` };
  if (pharmacyId) where.pharmacyId = pharmacyId;
  if (requiresPrescription !== undefined) where.requiresPrescription = requiresPrescription === 'true';
  if (maxPrice) where.price = { [Op.lte]: parseFloat(maxPrice) };
  where.stockQuantity = { [Op.gt]: 0 };

  const { count, rows } = await Medication.findAndCountAll({
    where, limit, offset,
    order: [['name', 'ASC']],
    include: [{ model: Pharmacy, as: 'pharmacy', where: { isVerified: true, isActive: true }, attributes: ['id', 'name', 'city', 'deliveryAvailable', 'deliveryFee'] }],
  });
  return { medications: rows, meta: paginateMeta(count, page, limit) };
};

// ─── PLACE ORDER ──────────────────────────────────────────
const placeOrder = async (patientId, data) => {
  const { pharmacyId, items, deliveryAddress, prescriptionId, paymentMethod, deliveryNotes } = data;

  const pharmacy = await Pharmacy.findByPk(pharmacyId);
  if (!pharmacy || !pharmacy.isActive) throw new AppError('Pharmacy not available', 400);

  // Validate items and calculate totals
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const med = await Medication.findOne({ where: { id: item.medicationId, pharmacyId, isActive: true } });
    if (!med) throw new AppError(`Medication ${item.medicationId} not found in this pharmacy`, 404);
    if (med.stockQuantity < item.quantity) throw new AppError(`Insufficient stock for ${med.name}`, 400);

    if (med.requiresPrescription && !prescriptionId) {
      throw new AppError(`${med.name} requires a prescription`, 400);
    }

    const totalPrice = parseFloat(med.price) * item.quantity;
    subtotal += totalPrice;
    validatedItems.push({ medicationId: med.id, quantity: item.quantity, unitPrice: med.price, totalPrice });
  }

  const deliveryFee = pharmacy.deliveryAvailable ? parseFloat(pharmacy.deliveryFee) : 0;
  const total = subtotal + deliveryFee;

  // Validate minimum order
  if (subtotal < parseFloat(pharmacy.minimumOrderAmount)) {
    throw new AppError(`Minimum order amount is ${pharmacy.minimumOrderAmount}`, 400);
  }

  // Validate prescription ownership if provided
  if (prescriptionId) {
    const prescription = await Prescription.findOne({ where: { id: prescriptionId, patientId, status: 'active' } });
    if (!prescription) throw new AppError('Invalid or expired prescription', 400);
  }

  // Create order in transaction
  const order = await sequelize.transaction(async (t) => {
    const newOrder = await Order.create({
      patientId, pharmacyId, prescriptionId, deliveryAddress,
      subtotal, deliveryFee, total, paymentMethod, deliveryNotes,
    }, { transaction: t });

    // Create order items
    const itemsWithOrderId = validatedItems.map((i) => ({ ...i, orderId: newOrder.id }));
    await OrderItem.bulkCreate(itemsWithOrderId, { transaction: t });

    // Deduct stock
    for (const item of validatedItems) {
      await Medication.decrement('stockQuantity', {
        by: item.quantity,
        where: { id: item.medicationId },
        transaction: t,
      });
    }

    return newOrder;
  });

  // Notify pharmacy
  if (pharmacy.user?.fcmToken) {
    await sendPushNotification({
      token: pharmacy.user.fcmToken,
      title: 'New Order Received',
      body: `Order #${order.orderNumber} has been placed`,
      data: { orderId: order.id },
    });
  }

  // Email patient
  const patient = await User.findByPk(patientId, { attributes: ['firstName', 'email'] });
  await sendEmail({
    to: patient.email,
    template: 'orderConfirmation',
    data: {
      patientName: patient.firstName,
      orderNumber: order.orderNumber,
      items: validatedItems.length,
    },
  });

  return getOrderById(order.id, patientId);
};

// ─── GET MY ORDERS (Patient) ──────────────────────────────
const getMyOrders = async (patientId, query) => {
  const { page, limit, offset } = paginate(query);
  const { status } = query;

  const where = { patientId };
  if (status) where.status = status;

  const { count, rows } = await Order.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [
      { model: Pharmacy, as: 'pharmacy', attributes: ['id', 'name', 'phone', 'logo'] },
      { model: OrderItem, as: 'items', include: [{ model: Medication, as: 'medication', attributes: ['id', 'name', 'imageUrl'] }] },
    ],
  });

  return { orders: rows, meta: paginateMeta(count, page, limit) };
};

// ─── GET PHARMACY ORDERS (Pharmacist) ────────────────────
const getPharmacyOrders = async (pharmacistUserId, query) => {
  const { page, limit, offset } = paginate(query);
  const { status } = query;

  const pharmacy = await Pharmacy.findOne({ where: { userId: pharmacistUserId } });
  if (!pharmacy) throw new AppError('Pharmacy not found', 404);

  const where = { pharmacyId: pharmacy.id };
  if (status) where.status = status;

  const { count, rows } = await Order.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [
      { model: User, as: 'patient', attributes: SAFE_USER },
      { model: OrderItem, as: 'items', include: [{ model: Medication, as: 'medication' }] },
      { model: Prescription, as: 'prescription', required: false },
    ],
  });

  return { orders: rows, meta: paginateMeta(count, page, limit) };
};

// ─── GET SINGLE ORDER ─────────────────────────────────────
const getOrderById = async (orderId, requesterId) => {
  const order = await Order.findByPk(orderId, {
    include: [
      { model: User, as: 'patient', attributes: SAFE_USER },
      { model: Pharmacy, as: 'pharmacy' },
      { model: OrderItem, as: 'items', include: [{ model: Medication, as: 'medication' }] },
      { model: Prescription, as: 'prescription', required: false },
    ],
  });
  if (!order) throw new AppError('Order not found', 404);
  if (order.patientId !== requesterId) throw new AppError('Not authorized', 403);
  return order;
};

// ─── UPDATE ORDER STATUS (Pharmacist / Real-time) ────────
const updateOrderStatus = async (pharmacistUserId, orderId, status, extra = {}, io) => {
  const pharmacy = await Pharmacy.findOne({ where: { userId: pharmacistUserId } });
  if (!pharmacy) throw new AppError('Pharmacy not found', 404);

  const order = await Order.findOne({
    where: { id: orderId, pharmacyId: pharmacy.id },
    include: [{ model: User, as: 'patient', attributes: ['id', 'firstName', 'email', 'fcmToken'] }],
  });
  if (!order) throw new AppError('Order not found', 404);

  const updates = { status };
  if (status === 'delivered') updates.deliveredAt = new Date();
  if (status === 'cancelled') updates.cancellationReason = extra.cancellationReason;
  if (extra.estimatedDeliveryTime) updates.estimatedDeliveryTime = extra.estimatedDeliveryTime;

  await order.update(updates);

  // Real-time update via Socket.IO
  if (io) {
    io.to(`user:${order.patientId}`).emit('order:status', { orderId, status, orderNumber: order.orderNumber });
  }

  // Push notification
  if (order.patient.fcmToken) {
    await sendPushNotification({
      token: order.patient.fcmToken,
      title: 'Order Update',
      body: `Your order #${order.orderNumber} is now ${status}`,
      data: { orderId },
    });
  }

  return order;
};

// ─── CANCEL ORDER (Patient) ───────────────────────────────
const cancelOrder = async (patientId, orderId, reason) => {
  const order = await Order.findOne({
    where: { id: orderId, patientId },
    include: [{ model: OrderItem, as: 'items' }],
  });
  if (!order) throw new AppError('Order not found', 404);
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError('Order cannot be cancelled at this stage', 400);
  }

  await sequelize.transaction(async (t) => {
    await order.update({ status: 'cancelled', cancellationReason: reason }, { transaction: t });
    // Restore stock
    for (const item of order.items) {
      await Medication.increment('stockQuantity', {
        by: item.quantity, where: { id: item.medicationId }, transaction: t,
      });
    }
  });

  return order;
};

module.exports = {
  addMedication, updateMedication, deleteMedication, searchMedications,
  placeOrder, getMyOrders, getPharmacyOrders, getOrderById, updateOrderStatus, cancelOrder,
};
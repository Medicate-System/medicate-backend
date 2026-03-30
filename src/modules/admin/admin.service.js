const { Op, fn, col, literal } = require('sequelize');
const User = require('../../models').User;
const Doctor = require('../../models').Doctor;
const Patient = require('../../models').Patient;
const Pharmacy = require('../../models').Pharmacy;
const Appointment = require('../../models').Appointment;
const Order = require('../../models').Order;
const { AppError } = require('../../utils/AppError');
const { sendNotification, broadcastNotification } = require('../notifications/notifications.service');
const { paginate, paginateMeta } = require('../../utils/pagination');

// ─── Platform Overview Stats ──────────────────────────────
const getDashboardStats = async () => {
  const [
    totalUsers, totalDoctors, totalPatients, totalPharmacies,
    totalAppointments, totalOrders, pendingDoctorVerifications, pendingPharmacyVerifications,
    recentAppointments, recentOrders,
  ] = await Promise.all([
    User.count({ where: { isActive: true } }),
    Doctor.count(),
    Patient.count(),
    Pharmacy.count(),
    Appointment.count(),
    Order.count(),
    Doctor.count({ where: { isVerified: false } }),
    Pharmacy.count({ where: { isVerified: false } }),
    Appointment.count({ where: { createdAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    Order.count({ where: { createdAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
  ]);

  return {
    overview: { totalUsers, totalDoctors, totalPatients, totalPharmacies, totalAppointments, totalOrders },
    pending: { doctorVerifications: pendingDoctorVerifications, pharmacyVerifications: pendingPharmacyVerifications },
    last7Days: { appointments: recentAppointments, orders: recentOrders },
  };
};

// ─── List all users with filters ─────────────────────────
const getAllUsers = async (query) => {
  const { page, limit, offset } = paginate(query);
  const { search, role, isActive } = query;

  const where = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken'] },
    limit, offset, order: [['createdAt', 'DESC']],
  });

  return { users: rows, meta: paginateMeta(count, page, limit) };
};

// ─── Toggle user active status ────────────────────────────
const toggleUserStatus = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin') throw new AppError('Cannot deactivate admin accounts', 403);
  await user.update({ isActive: !user.isActive });
  return { id: user.id, isActive: user.isActive };
};

// ─── Get pending verifications ────────────────────────────
const getPendingVerifications = async (type) => {
  if (type === 'doctors') {
    return Doctor.findAll({
      where: { isVerified: false },
      include: [{ model: User, as: 'user', attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken'] } }],
      order: [['createdAt', 'ASC']],
    });
  }
  if (type === 'pharmacies') {
    return Pharmacy.findAll({
      where: { isVerified: false },
      include: [{ model: User, as: 'user', attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken'] } }],
      order: [['createdAt', 'ASC']],
    });
  }
  throw new AppError('Type must be doctors or pharmacies', 400);
};

// ─── Appointment stats ────────────────────────────────────
const getAppointmentStats = async () => {
  const stats = await Appointment.findAll({
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });
  return stats;
};

// ─── Order stats ──────────────────────────────────────────
const getOrderStats = async () => {
  const stats = await Order.findAll({
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });
  return stats;
};

// ─── Send broadcast notification ─────────────────────────
const sendBroadcast = async ({ title, body, type, roles }) => {
  const where = { isActive: true };
  if (roles && roles.length > 0) where.role = { [Op.in]: roles };

  const users = await User.findAll({ where, attributes: ['id'] });
  const userIds = users.map((u) => u.id);

  await broadcastNotification({ userIds, title, body, type: type || 'system' });

  return { sent: userIds.length };
};

module.exports = {
  getDashboardStats, getAllUsers, toggleUserStatus,
  getPendingVerifications, getAppointmentStats, getOrderStats, sendBroadcast,
};
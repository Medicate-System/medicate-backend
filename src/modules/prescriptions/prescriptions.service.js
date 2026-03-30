
const User = require('../../models').User;
const Doctor = require('../../models').Doctor;
const Prescription = require('../../models').Prescription;
const PrescriptionItem = require('../../models').PrescriptionItem;
const { AppError } = require('../../utils/AppError');
const { uploadToCloudinary } = require('../../utils/upload');
const { paginate, paginateMeta } = require('../../utils/pagination');

const SAFE_USER = { exclude: ['password', 'refreshToken', 'passwordResetToken'] };

// ─── Patient uploads a prescription image ────────────────
const uploadPrescription = async (patientId, fileBuffer, mimeType, notes) => {
  const resourceType = mimeType === 'application/pdf' ? 'raw' : 'image';
  const result = await uploadToCloudinary(fileBuffer, 'healthcare/prescriptions', resourceType);

  const prescription = await Prescription.create({
    patientId,
    notes,
    isUploaded: true,
    ...(mimeType === 'application/pdf' ? { pdfUrl: result.secure_url } : { imageUrl: result.secure_url }),
  });

  return prescription;
};

// ─── Doctor issues digital prescription ──────────────────
const issuePrescription = async (doctorUserId, data) => {
  const { patientId, appointmentId, diagnosis, notes, expiryDate, items } = data;

  const doctor = await Doctor.findOne({ where: { userId: doctorUserId } });
  if (!doctor) throw new AppError('Doctor profile not found', 404);

  const prescription = await Prescription.create({
    patientId, doctorId: doctor.id, appointmentId,
    diagnosis, notes, expiryDate, isUploaded: false,
  });

  if (items && items.length > 0) {
    const itemsData = items.map((item) => ({ ...item, prescriptionId: prescription.id }));
    await PrescriptionItem.bulkCreate(itemsData);
  }

  return getPrescriptionById(prescription.id, patientId);
};

// ─── Get my prescriptions (patient) ──────────────────────
const getMyPrescriptions = async (patientId, query) => {
  const { page, limit, offset } = paginate(query);
  const { status } = query;

  const where = { patientId };
  if (status) where.status = status;

  const { count, rows } = await Prescription.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [
      { model: PrescriptionItem, as: 'items' },
      { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user', attributes: SAFE_USER }], required: false },
    ],
  });

  return { prescriptions: rows, meta: paginateMeta(count, page, limit) };
};

// ─── Get single prescription ──────────────────────────────
const getPrescriptionById = async (prescriptionId, requesterId) => {
  const prescription = await Prescription.findByPk(prescriptionId, {
    include: [
      { model: PrescriptionItem, as: 'items' },
      { model: User, as: 'patient', attributes: SAFE_USER },
      { model: Doctor, as: 'doctor', required: false, include: [{ model: User, as: 'user', attributes: SAFE_USER }] },
    ],
  });
  if (!prescription) throw new AppError('Prescription not found', 404);
  if (prescription.patientId !== requesterId) throw new AppError('Not authorized', 403);
  return prescription;
};

// ─── Pharmacist verifies / dispenses prescription ────────
const dispensePrescription = async (pharmacistUserId, prescriptionId, notes) => {
  const prescription = await Prescription.findByPk(prescriptionId);
  if (!prescription) throw new AppError('Prescription not found', 404);
  if (prescription.status !== 'active') throw new AppError(`Prescription is ${prescription.status}`, 400);

  await prescription.update({ status: 'dispensed', notes: prescription.notes
    ? `${prescription.notes}\nDispensed: ${notes}` : `Dispensed: ${notes}` });

  return prescription;
};

module.exports = {
  uploadPrescription, issuePrescription, getMyPrescriptions,
  getPrescriptionById, dispensePrescription,
};
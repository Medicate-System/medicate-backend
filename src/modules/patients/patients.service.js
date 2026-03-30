const { Op } = require('sequelize');
const User = require('../../models').User;
const PatientAddress = require('../../models').PatientAddress;
const Patient = require('../../models').Patient;
const { AppError } = require('../../utils/AppError');
const { cacheSet, cacheGet, cacheDel } = require('../../config/redis');
const { uploadToCloudinary } = require('../../utils/upload');
const { paginate, paginateMeta } = require('../../utils/pagination');

const CACHE_TTL = 60 * 10; // 10 minutes

// ─── Get or create patient profile ───────────────────────
const getOrCreateProfile = async (userId) => {
  let patient = await Patient.findOne({
    where: { userId },
    include: [{ model: User, as: 'user', attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken'] } }],
  });

  if (!patient) {
    patient = await Patient.create({ userId });
    patient = await Patient.findOne({
      where: { userId },
      include: [{ model: User, as: 'user', attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken'] } }],
    });
  }

  return patient;
};

// ─── Get My Profile ───────────────────────────────────────
const getMyProfile = async (userId) => {
  const cacheKey = `patient:profile:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const patient = await getOrCreateProfile(userId);
  await cacheSet(cacheKey, patient, CACHE_TTL);
  return patient;
};

// ─── Update Profile ───────────────────────────────────────
const updateProfile = async (userId, updates) => {
  const {
    firstName, lastName, phone, // User fields
    dateOfBirth, gender, bloodGroup, height, weight,
    allergies, chronicConditions, currentMedications,
    emergencyContactName, emergencyContactPhone, emergencyContactRelation,
    insuranceProvider, insuranceNumber, notes,
  } = updates;

  // Update User table fields
  if (firstName || lastName || phone) {
    await User.update(
      { ...(firstName && { firstName }), ...(lastName && { lastName }), ...(phone && { phone }) },
      { where: { id: userId } }
    );
  }

  // Upsert Patient profile
  const [patient] = await Patient.upsert({
    userId,
    ...(dateOfBirth !== undefined && { dateOfBirth }),
    ...(gender !== undefined && { gender }),
    ...(bloodGroup !== undefined && { bloodGroup }),
    ...(height !== undefined && { height }),
    ...(weight !== undefined && { weight }),
    ...(allergies !== undefined && { allergies }),
    ...(chronicConditions !== undefined && { chronicConditions }),
    ...(currentMedications !== undefined && { currentMedications }),
    ...(emergencyContactName !== undefined && { emergencyContactName }),
    ...(emergencyContactPhone !== undefined && { emergencyContactPhone }),
    ...(emergencyContactRelation !== undefined && { emergencyContactRelation }),
    ...(insuranceProvider !== undefined && { insuranceProvider }),
    ...(insuranceNumber !== undefined && { insuranceNumber }),
    ...(notes !== undefined && { notes }),
  });

  await cacheDel(`patient:profile:${userId}`);
  return getMyProfile(userId);
};

// ─── Upload Avatar ────────────────────────────────────────
const updateAvatar = async (userId, fileBuffer) => {
  const result = await uploadToCloudinary(fileBuffer, 'healthcare/avatars');
  await User.update({ avatar: result.secure_url }, { where: { id: userId } });
  await cacheDel(`patient:profile:${userId}`);
  return { avatar: result.secure_url };
};

// ─── Addresses ────────────────────────────────────────────
const getAddresses = async (userId) => {
  const patient = await getOrCreateProfile(userId);
  return PatientAddress.findAll({ where: { patientId: patient.id }, order: [['isDefault', 'DESC']] });
};

const addAddress = async (userId, addressData) => {
  const patient = await getOrCreateProfile(userId);

  // If this is the first address or marked default, unset others
  if (addressData.isDefault) {
    await PatientAddress.update({ isDefault: false }, { where: { patientId: patient.id } });
  }

  const count = await PatientAddress.count({ where: { patientId: patient.id } });
  if (count === 0) addressData.isDefault = true; // First address auto-defaults

  return PatientAddress.create({ ...addressData, patientId: patient.id });
};

const updateAddress = async (userId, addressId, updates) => {
  const patient = await getOrCreateProfile(userId);
  const address = await PatientAddress.findOne({ where: { id: addressId, patientId: patient.id } });
  if (!address) throw new AppError('Address not found', 404);

  if (updates.isDefault) {
    await PatientAddress.update({ isDefault: false }, { where: { patientId: patient.id } });
  }

  await address.update(updates);
  return address;
};

const deleteAddress = async (userId, addressId) => {
  const patient = await getOrCreateProfile(userId);
  const address = await PatientAddress.findOne({ where: { id: addressId, patientId: patient.id } });
  if (!address) throw new AppError('Address not found', 404);
  if (address.isDefault) throw new AppError('Cannot delete default address. Set another as default first.', 400);
  await address.destroy();
};

// ─── Admin: List All Patients ─────────────────────────────
const getAllPatients = async (query) => {
  const { page, limit, offset } = paginate(query);
  const search = query.search;

  const whereUser = search
    ? {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ],
      }
    : {};

  const { count, rows } = await Patient.findAndCountAll({
    include: [
      {
        model: User,
        as: 'user',
        where: { ...whereUser, role: 'patient' },
        attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken'] },
      },
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
  });

  return { patients: rows, meta: paginateMeta(count, page, limit) };
};

// ─── Admin: Get Single Patient ────────────────────────────
const getPatientById = async (patientId) => {
  const patient = await Patient.findByPk(patientId, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken'] },
      },
      { model: PatientAddress, as: 'addresses' },
    ],
  });
  if (!patient) throw new AppError('Patient not found', 404);
  return patient;
};

module.exports = {
  getMyProfile,
  updateProfile,
  updateAvatar,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getAllPatients,
  getPatientById,
};
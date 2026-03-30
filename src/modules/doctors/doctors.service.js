const { Op } = require('sequelize');
const User = require('../../models').User;
const Doctor = require('../../models').Doctor;
const DoctorClinic = require('../../models').DoctorClinic;
const DoctorSchedule = require('../../models').DoctorSchedule;
const DoctorReview = require('../../models').DoctorReview;
const { AppError } = require('../../utils/AppError');
const { cacheSet, cacheGet, cacheDel } = require('../../config/redis');
const { paginate, paginateMeta } = require('../../utils/pagination');
const { uploadToCloudinary } = require('../../utils/upload');
const { sequelize } = require('../../config/database');

const SAFE_USER = { exclude: ['password', 'refreshToken', 'passwordResetToken'] };
const CACHE_TTL = 60 * 15;

// ─── Get or create doctor profile ────────────────────────
const getOrCreate = async (userId) => {
  let doctor = await Doctor.findOne({ where: { userId } });
  if (!doctor) throw new AppError('Doctor profile not found. Please complete registration.', 404);
  return doctor;
};

// ─── Get My Profile ───────────────────────────────────────
const getMyProfile = async (userId) => {
  const cacheKey = `doctor:profile:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const doctor = await Doctor.findOne({
    where: { userId },
    include: [
      { model: User, as: 'user', attributes: SAFE_USER },
      { model: DoctorClinic, as: 'clinics' },
      { model: DoctorSchedule, as: 'schedules', include: [{ model: DoctorClinic, as: 'clinic' }] },
    ],
  });
  if (!doctor) throw new AppError('Doctor profile not found', 404);
  await cacheSet(cacheKey, doctor, CACHE_TTL);
  return doctor;
};

// ─── Setup / Update Profile ───────────────────────────────
const upsertProfile = async (userId, data) => {
  const {
    specialization, subSpecializations, licenseNumber, yearsOfExperience,
    qualifications, languages, bio, consultationFee,
    firstName, lastName, phone,
  } = data;

  if (firstName || lastName || phone) {
    await User.update(
      { ...(firstName && { firstName }), ...(lastName && { lastName }), ...(phone && { phone }) },
      { where: { id: userId } }
    );
  }

  await Doctor.upsert({
    userId,
    ...(specialization && { specialization }),
    ...(subSpecializations && { subSpecializations }),
    ...(licenseNumber && { licenseNumber }),
    ...(yearsOfExperience !== undefined && { yearsOfExperience }),
    ...(qualifications && { qualifications }),
    ...(languages && { languages }),
    ...(bio !== undefined && { bio }),
    ...(consultationFee !== undefined && { consultationFee }),
  });

  await cacheDel(`doctor:profile:${userId}`);
  return getMyProfile(userId);
};

// ─── Clinics ──────────────────────────────────────────────
const addClinic = async (userId, clinicData) => {
  const doctor = await getOrCreate(userId);
  if (clinicData.isPrimary) {
    await DoctorClinic.update({ isPrimary: false }, { where: { doctorId: doctor.id } });
  }
  const count = await DoctorClinic.count({ where: { doctorId: doctor.id } });
  if (count === 0) clinicData.isPrimary = true;
  return DoctorClinic.create({ ...clinicData, doctorId: doctor.id });
};

const updateClinic = async (userId, clinicId, updates) => {
  const doctor = await getOrCreate(userId);
  const clinic = await DoctorClinic.findOne({ where: { id: clinicId, doctorId: doctor.id } });
  if (!clinic) throw new AppError('Clinic not found', 404);
  if (updates.isPrimary) {
    await DoctorClinic.update({ isPrimary: false }, { where: { doctorId: doctor.id } });
  }
  await clinic.update(updates);
  await cacheDel(`doctor:profile:${userId}`);
  return clinic;
};

const deleteClinic = async (userId, clinicId) => {
  const doctor = await getOrCreate(userId);
  const clinic = await DoctorClinic.findOne({ where: { id: clinicId, doctorId: doctor.id } });
  if (!clinic) throw new AppError('Clinic not found', 404);
  if (clinic.isPrimary) throw new AppError('Cannot delete primary clinic', 400);
  await clinic.destroy();
};

// ─── Schedules ────────────────────────────────────────────
const setSchedule = async (userId, scheduleData) => {
  const doctor = await getOrCreate(userId);
  const { dayOfWeek, clinicId, startTime, endTime, slotDurationMinutes, maxPatients } = scheduleData;

  const [schedule, created] = await DoctorSchedule.findOrCreate({
    where: { doctorId: doctor.id, dayOfWeek },
    defaults: { doctorId: doctor.id, clinicId, dayOfWeek, startTime, endTime, slotDurationMinutes, maxPatients },
  });

  if (!created) {
    await schedule.update({ clinicId, startTime, endTime, slotDurationMinutes, maxPatients, isActive: true });
  }

  await cacheDel(`doctor:profile:${userId}`);
  return schedule;
};

const deleteSchedule = async (userId, scheduleId) => {
  const doctor = await getOrCreate(userId);
  const schedule = await DoctorSchedule.findOne({ where: { id: scheduleId, doctorId: doctor.id } });
  if (!schedule) throw new AppError('Schedule not found', 404);
  await schedule.destroy();
  await cacheDel(`doctor:profile:${userId}`);
};

// ─── Search Doctors ───────────────────────────────────────
const searchDoctors = async (query) => {
  const { page, limit, offset } = paginate(query);
  const { search, specialization, city, minRating, maxFee, available } = query;

  const doctorWhere = {};
  if (specialization) doctorWhere.specialization = { [Op.iLike]: `%${specialization}%` };
  if (minRating) doctorWhere.averageRating = { [Op.gte]: parseFloat(minRating) };
  if (maxFee) doctorWhere.consultationFee = { [Op.lte]: parseFloat(maxFee) };
  if (available === 'true') doctorWhere.isAvailable = true;
  doctorWhere.isVerified = true;

  const userWhere = { role: 'doctor', isActive: true };
  if (search) {
    userWhere[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const clinicWhere = {};
  if (city) clinicWhere.city = { [Op.iLike]: `%${city}%` };

  const { count, rows } = await Doctor.findAndCountAll({
    where: doctorWhere,
    include: [
      { model: User, as: 'user', where: userWhere, attributes: SAFE_USER },
      { model: DoctorClinic, as: 'clinics', where: Object.keys(clinicWhere).length ? clinicWhere : undefined, required: Object.keys(clinicWhere).length > 0 },
      { model: DoctorSchedule, as: 'schedules', where: { isActive: true }, required: false },
    ],
    limit, offset,
    order: [['averageRating', 'DESC']],
    distinct: true,
  });

  return { doctors: rows, meta: paginateMeta(count, page, limit) };
};

// ─── Get Doctor by ID (public) ────────────────────────────
const getDoctorById = async (doctorId) => {
  const cacheKey = `doctor:public:${doctorId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const doctor = await Doctor.findByPk(doctorId, {
    include: [
      { model: User, as: 'user', attributes: SAFE_USER },
      { model: DoctorClinic, as: 'clinics' },
      { model: DoctorSchedule, as: 'schedules', where: { isActive: true }, required: false, include: [{ model: DoctorClinic, as: 'clinic' }] },
      { model: DoctorReview, as: 'reviews', limit: 10, order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'patient', attributes: ['firstName', 'lastName', 'avatar'] }] },
    ],
  });
  if (!doctor) throw new AppError('Doctor not found', 404);
  await cacheSet(cacheKey, doctor, CACHE_TTL);
  return doctor;
};

// ─── Reviews ──────────────────────────────────────────────
const addReview = async (patientUserId, doctorId, reviewData) => {
  const { rating, comment, appointmentId, isAnonymous } = reviewData;

  const existing = appointmentId
    ? await DoctorReview.findOne({ where: { patientId: patientUserId, appointmentId } })
    : null;
  if (existing) throw new AppError('You have already reviewed this appointment', 409);

  const review = await DoctorReview.create({
    doctorId, patientId: patientUserId, rating, comment, appointmentId, isAnonymous,
  });

  // Recalculate average rating
  const stats = await DoctorReview.findOne({
    where: { doctorId },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'avg'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    raw: true,
  });
  await Doctor.update(
    { averageRating: parseFloat(stats.avg).toFixed(1), totalReviews: stats.count },
    { where: { id: doctorId } }
  );

  await cacheDel(`doctor:public:${doctorId}`);
  return review;
};

// ─── Toggle availability ──────────────────────────────────
const toggleAvailability = async (userId) => {
  const doctor = await getOrCreate(userId);
  await doctor.update({ isAvailable: !doctor.isAvailable });
  await cacheDel(`doctor:profile:${userId}`);
  await cacheDel(`doctor:public:${doctor.id}`);
  return { isAvailable: doctor.isAvailable };
};

// ─── Admin ────────────────────────────────────────────────
const verifyDoctor = async (doctorId) => {
  const doctor = await Doctor.findByPk(doctorId);
  if (!doctor) throw new AppError('Doctor not found', 404);
  await doctor.update({ isVerified: true });
  await cacheDel(`doctor:public:${doctorId}`);
  return doctor;
};

module.exports = {
  getMyProfile, upsertProfile, addClinic, updateClinic, deleteClinic,
  setSchedule, deleteSchedule, searchDoctors, getDoctorById,
  addReview, toggleAvailability, verifyDoctor,
};
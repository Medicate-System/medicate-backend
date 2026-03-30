const { Op } = require('sequelize');
const User = require('../../models').User;
const Pharmacy = require('../../models').Pharmacy;
const { AppError } = require('../../utils/AppError');
const { cacheSet, cacheGet, cacheDel } = require('../../config/redis');
const { paginate, paginateMeta } = require('../../utils/pagination');
const { uploadToCloudinary } = require('../../utils/upload');

const SAFE_USER = { exclude: ['password', 'refreshToken', 'passwordResetToken'] };
const CACHE_TTL = 60 * 15;

const getMyProfile = async (userId) => {
  const pharmacy = await Pharmacy.findOne({
    where: { userId },
    include: [{ model: User, as: 'user', attributes: SAFE_USER }],
  });
  if (!pharmacy) throw new AppError('Pharmacy profile not found', 404);
  return pharmacy;
};

const upsertProfile = async (userId, data) => {
  const { name, licenseNumber, description, street, city, district, country,
    latitude, longitude, phone, email, openingTime, closingTime,
    workingDays, deliveryAvailable, deliveryRadiusKm, deliveryFee, minimumOrderAmount } = data;

  await Pharmacy.upsert({
    userId,
    ...(name && { name }), ...(licenseNumber && { licenseNumber }),
    ...(description !== undefined && { description }),
    ...(street && { street }), ...(city && { city }),
    ...(district !== undefined && { district }),
    ...(country && { country }),
    ...(latitude !== undefined && { latitude }), ...(longitude !== undefined && { longitude }),
    ...(phone && { phone }), ...(email && { email }),
    ...(openingTime && { openingTime }), ...(closingTime && { closingTime }),
    ...(workingDays && { workingDays }),
    ...(deliveryAvailable !== undefined && { deliveryAvailable }),
    ...(deliveryRadiusKm !== undefined && { deliveryRadiusKm }),
    ...(deliveryFee !== undefined && { deliveryFee }),
    ...(minimumOrderAmount !== undefined && { minimumOrderAmount }),
  });

  await cacheDel(`pharmacy:profile:${userId}`);
  return getMyProfile(userId);
};

const updateLogo = async (userId, fileBuffer) => {
  const result = await uploadToCloudinary(fileBuffer, 'healthcare/pharmacies');
  const pharmacy = await Pharmacy.findOne({ where: { userId } });
  if (!pharmacy) throw new AppError('Pharmacy not found', 404);
  await pharmacy.update({ logo: result.secure_url });
  return { logo: result.secure_url };
};

const searchPharmacies = async (query) => {
  const { page, limit, offset } = paginate(query);
  const { search, city, delivery } = query;

  const where = { isVerified: true, isActive: true };
  if (city) where.city = { [Op.iLike]: `%${city}%` };
  if (delivery === 'true') where.deliveryAvailable = true;
  if (search) where.name = { [Op.iLike]: `%${search}%` };

  const { count, rows } = await Pharmacy.findAndCountAll({
    where, limit, offset, order: [['averageRating', 'DESC']],
  });
  return { pharmacies: rows, meta: paginateMeta(count, page, limit) };
};

const getPharmacyById = async (pharmacyId) => {
  const cacheKey = `pharmacy:public:${pharmacyId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const pharmacy = await Pharmacy.findByPk(pharmacyId, {
    include: [{ model: User, as: 'user', attributes: SAFE_USER }],
  });
  if (!pharmacy) throw new AppError('Pharmacy not found', 404);
  await cacheSet(cacheKey, pharmacy, CACHE_TTL);
  return pharmacy;
};

const verifyPharmacy = async (pharmacyId) => {
  const pharmacy = await Pharmacy.findByPk(pharmacyId);
  if (!pharmacy) throw new AppError('Pharmacy not found', 404);
  await pharmacy.update({ isVerified: true });
  await cacheDel(`pharmacy:public:${pharmacyId}`);
  return pharmacy;
};

module.exports = { getMyProfile, upsertProfile, updateLogo, searchPharmacies, getPharmacyById, verifyPharmacy };
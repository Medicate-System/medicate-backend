const { body, param, query } = require('express-validator');

const profileValidator = [
  body('specialization').optional().notEmpty(),
  body('licenseNumber').optional().notEmpty(),
  body('yearsOfExperience').optional().isInt({ min: 0 }),
  body('consultationFee').optional().isFloat({ min: 0 }),
  body('languages').optional().isArray(),
  body('qualifications').optional().isArray(),
];

const clinicValidator = [
  body('name').notEmpty().withMessage('Clinic name required'),
  body('street').notEmpty(), body('city').notEmpty(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
];

const scheduleValidator = [
  body('dayOfWeek').isIn(['monday','tuesday','wednesday','thursday','friday','saturday','sunday']),
  body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('Format HH:MM'),
  body('endTime').matches(/^\d{2}:\d{2}$/).withMessage('Format HH:MM'),
  body('slotDurationMinutes').optional().isInt({ min: 10, max: 120 }),
];

const reviewValidator = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
  body('comment').optional().isLength({ max: 1000 }),
  body('isAnonymous').optional().isBoolean(),
];

module.exports = { profileValidator, clinicValidator, scheduleValidator, reviewValidator };
const { body, param } = require('express-validator');

const updateProfileValidator = [
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name too short'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name too short'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('dateOfBirth').optional().isDate().withMessage('Invalid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender value'),
  body('bloodGroup')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group'),
  body('height').optional().isFloat({ min: 30, max: 300 }).withMessage('Height must be in cm (30–300)'),
  body('weight').optional().isFloat({ min: 1, max: 500 }).withMessage('Weight must be in kg (1–500)'),
  body('allergies').optional().isArray().withMessage('Allergies must be an array'),
  body('chronicConditions').optional().isArray().withMessage('Chronic conditions must be an array'),
  body('currentMedications').optional().isArray().withMessage('Medications must be an array'),
  body('emergencyContactPhone').optional().isMobilePhone().withMessage('Invalid emergency phone'),
];

const addressValidator = [
  body('street').notEmpty().withMessage('Street is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('country').optional().isString(),
  body('label').optional().isIn(['home', 'work', 'other']).withMessage('Label must be home, work, or other'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('isDefault').optional().isBoolean(),
];

const patientIdValidator = [
  param('patientId').isUUID().withMessage('Invalid patient ID'),
];

const addressIdValidator = [
  param('addressId').isUUID().withMessage('Invalid address ID'),
];

module.exports = {
  updateProfileValidator,
  addressValidator,
  patientIdValidator,
  addressIdValidator,
};
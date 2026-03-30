const { body, query } = require('express-validator');

const bookValidator = [
  body('doctorId').isUUID().withMessage('Valid doctor ID required'),
  body('appointmentDate').isDate().withMessage('Valid date required'),
  body('startTime').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Format HH:MM'),
  body('type').isIn(['in_person', 'telemedicine']),
  body('reasonForVisit').optional().isLength({ max: 500 }),
  body('symptoms').optional().isArray(),
];

const statusValidator = [
  body('status').isIn(['confirmed', 'cancelled', 'completed', 'no_show']).withMessage('Invalid status'),
  body('cancellationReason').if(body('status').equals('cancelled')).notEmpty().withMessage('Cancellation reason required'),
];

const slotsValidator = [
  query('date').isDate().withMessage('Valid date required (YYYY-MM-DD)'),
];

module.exports = { bookValidator, statusValidator, slotsValidator };
const express = require('express');
const router = express.Router();

const controller = require('./patients.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { upload } = require('../../utils/upload');
const {
  updateProfileValidator,
  addressValidator,
  patientIdValidator,
  addressIdValidator,
} = require('./patients.validator');

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Patient profile and address management
 */

// ─── All routes require authentication ───────────────────
router.use(authenticate);

/**
 * @swagger
 * /patients/me:
 *   get:
 *     summary: Get my patient profile
 *     tags: [Patients]
 *   patch:
 *     summary: Update my patient profile
 *     tags: [Patients]
 */
router
  .route('/me')
  .get(authorize('patient'), controller.getMyProfile)
  .patch(authorize('patient'), updateProfileValidator, validate, controller.updateProfile);

/**
 * @swagger
 * /patients/me/avatar:
 *   patch:
 *     summary: Upload or update profile avatar
 *     tags: [Patients]
 */
router.patch(
  '/me/avatar',
  authorize('patient'),
  upload.single('avatar'),
  controller.updateAvatar
);

/**
 * @swagger
 * /patients/me/addresses:
 *   get:
 *     summary: Get all delivery addresses
 *     tags: [Patients]
 *   post:
 *     summary: Add a new delivery address
 *     tags: [Patients]
 */
router
  .route('/me/addresses')
  .get(authorize('patient'), controller.getAddresses)
  .post(authorize('patient'), addressValidator, validate, controller.addAddress);

/**
 * @swagger
 * /patients/me/addresses/{addressId}:
 *   patch:
 *     summary: Update a delivery address
 *     tags: [Patients]
 *   delete:
 *     summary: Delete a delivery address
 *     tags: [Patients]
 */
router
  .route('/me/addresses/:addressId')
  .patch(authorize('patient'), addressIdValidator, addressValidator, validate, controller.updateAddress)
  .delete(authorize('patient'), addressIdValidator, validate, controller.deleteAddress);

// ─── Admin Routes ─────────────────────────────────────────

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: List all patients (admin only)
 *     tags: [Patients]
 */
router.get('/', authorize('admin'), controller.getAllPatients);

/**
 * @swagger
 * /patients/{patientId}:
 *   get:
 *     summary: Get a single patient by ID (admin or doctor)
 *     tags: [Patients]
 */
router.get(
  '/:patientId',
  authorize('admin', 'doctor'),
  patientIdValidator,
  validate,
  controller.getPatientById
);

module.exports = router;
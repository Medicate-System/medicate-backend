const express = require('express');
const router = express.Router();
const ctrl = require('./prescriptions.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { upload } = require('../../utils/upload');

/**
 * @swagger
 * tags:
 *   name: Prescriptions
 *   description: Prescription management — upload, issue, and dispense
 */

router.use(authenticate);

/**
 * @swagger
 * /prescriptions/my:
 *   get:
 *     summary: Get my prescriptions as a patient
 *     tags: [Prescriptions]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, expired, dispensed, cancelled] }
 */
router.get('/my', authorize('patient'), ctrl.getMyPrescriptions);

/**
 * @swagger
 * /prescriptions/upload:
 *   post:
 *     summary: Upload a prescription image or PDF
 *     tags: [Prescriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               prescription:
 *                 type: string
 *                 format: binary
 *               notes:
 *                 type: string
 */
router.post('/upload', authorize('patient'), upload.single('prescription'), ctrl.uploadPrescription);

/**
 * @swagger
 * /prescriptions/issue:
 *   post:
 *     summary: Issue a digital prescription (doctor only)
 *     tags: [Prescriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, items]
 *             properties:
 *               patientId: { type: string }
 *               appointmentId: { type: string }
 *               diagnosis: { type: string }
 *               notes: { type: string }
 *               expiryDate: { type: string, example: "2026-07-01" }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     medicationName: { type: string }
 *                     dosage: { type: string }
 *                     frequency: { type: string }
 *                     duration: { type: string }
 *                     quantity: { type: integer }
 *                     instructions: { type: string }
 */
router.post('/issue', authorize('doctor'), ctrl.issuePrescription);

/**
 * @swagger
 * /prescriptions/{prescriptionId}:
 *   get:
 *     summary: Get a single prescription by ID
 *     tags: [Prescriptions]
 */
router.get('/:prescriptionId', authorize('patient', 'doctor', 'pharmacist'), ctrl.getPrescriptionById);

/**
 * @swagger
 * /prescriptions/{prescriptionId}/dispense:
 *   patch:
 *     summary: Mark a prescription as dispensed (pharmacist only)
 *     tags: [Prescriptions]
 */
router.patch('/:prescriptionId/dispense', authorize('pharmacist'), ctrl.dispensePrescription);

module.exports = router;
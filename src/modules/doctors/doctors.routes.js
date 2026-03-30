const express = require('express');
const router = express.Router();
const ctrl = require('./doctors.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { profileValidator, clinicValidator, scheduleValidator, reviewValidator } = require('./doctors.validator');

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: Doctor profiles, clinics, schedules and reviews
 */

/**
 * @swagger
 * /doctors/search:
 *   get:
 *     summary: Search and filter doctors
 *     tags: [Doctors]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: specialization
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: available
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of doctors
 */
router.get('/search', ctrl.searchDoctors);

/**
 * @swagger
 * /doctors/me/profile:
 *   get:
 *     summary: Get my doctor profile
 *     tags: [Doctors]
 *   patch:
 *     summary: Update my doctor profile
 *     tags: [Doctors]
 */
router.get('/me/profile', authenticate, authorize('doctor'), ctrl.getMyProfile);
router.patch('/me/profile', authenticate, authorize('doctor'), profileValidator, validate, ctrl.upsertProfile);

/**
 * @swagger
 * /doctors/me/availability:
 *   patch:
 *     summary: Toggle my availability status
 *     tags: [Doctors]
 */
router.patch('/me/availability', authenticate, authorize('doctor'), ctrl.toggleAvailability);

/**
 * @swagger
 * /doctors/me/clinics:
 *   post:
 *     summary: Add a clinic location
 *     tags: [Doctors]
 */
router.post('/me/clinics', authenticate, authorize('doctor'), clinicValidator, validate, ctrl.addClinic);

/**
 * @swagger
 * /doctors/me/clinics/{clinicId}:
 *   patch:
 *     summary: Update a clinic
 *     tags: [Doctors]
 *   delete:
 *     summary: Delete a clinic
 *     tags: [Doctors]
 */
router.patch('/me/clinics/:clinicId', authenticate, authorize('doctor'), clinicValidator, validate, ctrl.updateClinic);
router.delete('/me/clinics/:clinicId', authenticate, authorize('doctor'), ctrl.deleteClinic);

/**
 * @swagger
 * /doctors/me/schedules:
 *   post:
 *     summary: Set a weekly schedule slot
 *     tags: [Doctors]
 */
router.post('/me/schedules', authenticate, authorize('doctor'), scheduleValidator, validate, ctrl.setSchedule);

/**
 * @swagger
 * /doctors/me/schedules/{scheduleId}:
 *   delete:
 *     summary: Delete a schedule slot
 *     tags: [Doctors]
 */
router.delete('/me/schedules/:scheduleId', authenticate, authorize('doctor'), ctrl.deleteSchedule);

/**
 * @swagger
 * /doctors/{doctorId}:
 *   get:
 *     summary: Get a doctor's public profile
 *     tags: [Doctors]
 *     security: []
 */
router.get('/:doctorId', ctrl.getDoctorById);

/**
 * @swagger
 * /doctors/{doctorId}/reviews:
 *   post:
 *     summary: Submit a review for a doctor
 *     tags: [Doctors]
 */
router.post('/:doctorId/reviews', authenticate, authorize('patient'), reviewValidator, validate, ctrl.addReview);

/**
 * @swagger
 * /doctors/{doctorId}/verify:
 *   patch:
 *     summary: Verify a doctor account (admin only)
 *     tags: [Doctors]
 */
router.patch('/:doctorId/verify', authenticate, authorize('admin'), ctrl.verifyDoctor);

module.exports = router;
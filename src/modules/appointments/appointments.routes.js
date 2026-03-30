const express = require('express');
const router = express.Router();
const ctrl = require('./appointments.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { bookValidator, statusValidator, slotsValidator } = require('./appointments.validator');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Booking and managing appointments
 */

router.use(authenticate);

/**
 * @swagger
 * /appointments/my:
 *   get:
 *     summary: Get my appointments as a patient
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: upcoming
 *         schema: { type: boolean }
 */
router.get('/my', authorize('patient'), ctrl.getMyAppointments);

/**
 * @swagger
 * /appointments/doctor:
 *   get:
 *     summary: Get my appointments as a doctor
 *     tags: [Appointments]
 */
router.get('/doctor', authorize('doctor'), ctrl.getDoctorAppointments);

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Book a new appointment
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorId, appointmentDate, startTime, type]
 *             properties:
 *               doctorId: { type: string }
 *               appointmentDate: { type: string, example: "2026-04-15" }
 *               startTime: { type: string, example: "09:00" }
 *               type: { type: string, enum: [in_person, telemedicine] }
 *               reasonForVisit: { type: string }
 */
router.post('/', authorize('patient'), bookValidator, validate, ctrl.bookAppointment);

/**
 * @swagger
 * /appointments/slots/{doctorId}:
 *   get:
 *     summary: Get available time slots for a doctor on a given date
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, example: "2026-04-15" }
 */
router.get('/slots/:doctorId', slotsValidator, validate, ctrl.getAvailableSlots);

/**
 * @swagger
 * /appointments/{appointmentId}:
 *   get:
 *     summary: Get a single appointment by ID
 *     tags: [Appointments]
 */
router.get('/:appointmentId', ctrl.getAppointmentById);

/**
 * @swagger
 * /appointments/{appointmentId}/status:
 *   patch:
 *     summary: Update appointment status (confirm, cancel, complete)
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [confirmed, cancelled, completed, no_show] }
 *               cancellationReason: { type: string }
 *               notes: { type: string }
 *               diagnosis: { type: string }
 */
router.patch('/:appointmentId/status', statusValidator, validate, ctrl.updateStatus);

module.exports = router;
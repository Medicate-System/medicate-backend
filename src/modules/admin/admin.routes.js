const express = require('express');
const router = express.Router();
const ctrl = require('./admin.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Platform administration — stats, verifications, user management
 */

router.use(authenticate, authorize('admin'));

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get platform overview stats
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalUsers: { type: integer }
 *                     totalDoctors: { type: integer }
 *                     totalPatients: { type: integer }
 *                     totalPharmacies: { type: integer }
 *                     totalAppointments: { type: integer }
 *                     totalOrders: { type: integer }
 *                 pending:
 *                   type: object
 *                   properties:
 *                     doctorVerifications: { type: integer }
 *                     pharmacyVerifications: { type: integer }
 *                 last7Days:
 *                   type: object
 *                   properties:
 *                     appointments: { type: integer }
 *                     orders: { type: integer }
 */
router.get('/dashboard', ctrl.getDashboardStats);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all platform users with filters
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [patient, doctor, pharmacist, admin]
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated list of users
 */
router.get('/users', ctrl.getAllUsers);

/**
 * @swagger
 * /admin/users/{userId}/toggle-status:
 *   patch:
 *     summary: Activate or deactivate a user account
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: UUID of the user to toggle
 *     responses:
 *       200:
 *         description: User status toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 isActive: { type: boolean }
 *       403:
 *         description: Cannot deactivate admin accounts
 *       404:
 *         description: User not found
 */
router.patch('/users/:userId/toggle-status', ctrl.toggleUserStatus);

/**
 * @swagger
 * /admin/verifications/{type}:
 *   get:
 *     summary: Get pending verifications for doctors or pharmacies
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [doctors, pharmacies]
 *         description: The type of verifications to retrieve
 *     responses:
 *       200:
 *         description: List of unverified doctors or pharmacies
 *       400:
 *         description: Type must be doctors or pharmacies
 */
router.get('/verifications/:type', ctrl.getPendingVerifications);

/**
 * @swagger
 * /admin/stats/appointments:
 *   get:
 *     summary: Get appointment counts grouped by status
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Appointment stats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   status: { type: string }
 *                   count: { type: integer }
 */
router.get('/stats/appointments', ctrl.getAppointmentStats);

/**
 * @swagger
 * /admin/stats/orders:
 *   get:
 *     summary: Get order counts grouped by status
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Order stats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   status: { type: string }
 *                   count: { type: integer }
 */
router.get('/stats/orders', ctrl.getOrderStats);

/**
 * @swagger
 * /admin/broadcast:
 *   post:
 *     summary: Send a push notification broadcast to users by role
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Platform Maintenance"
 *               message:
 *                 type: string
 *                 example: "The platform will be down for maintenance at 2AM."
 *               type:
 *                 type: string
 *                 enum: [appointment, order, prescription, system, reminder]
 *                 default: system
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [patient, doctor, pharmacist, admin]
 *                 description: Leave empty to broadcast to all users
 *                 example: ["patient", "doctor"]
 *     responses:
 *       200:
 *         description: Broadcast sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sent: { type: integer, description: Number of users notified }
 */
router.post('/broadcast', [
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required'),
  body('roles').optional().isArray().withMessage('Roles must be an array'),
], validate, ctrl.sendBroadcast);

module.exports = router;
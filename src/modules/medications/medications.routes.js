const express = require('express');
const router = express.Router();
const ctrl = require('./medications.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { upload } = require('../../utils/upload');

/**
 * @swagger
 * tags:
 *   name: Medications & Orders
 *   description: Medication catalog and pharmacy order management
 */

/**
 * @swagger
 * /medications/search:
 *   get:
 *     summary: Search medications across all pharmacies
 *     tags: [Medications & Orders]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: pharmacyId
 *         schema: { type: string }
 *       - in: query
 *         name: requiresPrescription
 *         schema: { type: boolean }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: List of medications
 */
router.get('/search', ctrl.searchMedications);

// ─── Orders — all specific order routes BEFORE /:medicationId ─
/**
 * @swagger
 * /medications/orders:
 *   post:
 *     summary: Place a medication order
 *     tags: [Medications & Orders]
 */
router.post('/orders', authenticate, authorize('patient'), ctrl.placeOrder);

/**
 * @swagger
 * /medications/orders/my:
 *   get:
 *     summary: Get my orders as a patient
 *     tags: [Medications & Orders]
 */
router.get('/orders/my', authenticate, authorize('patient'), ctrl.getMyOrders);

/**
 * @swagger
 * /medications/orders/pharmacy:
 *   get:
 *     summary: Get all orders for my pharmacy
 *     tags: [Medications & Orders]
 */
router.get('/orders/pharmacy', authenticate, authorize('pharmacist'), ctrl.getPharmacyOrders);

/**
 * @swagger
 * /medications/orders/{orderId}:
 *   get:
 *     summary: Get a single order by ID
 *     tags: [Medications & Orders]
 */
router.get('/orders/:orderId', authenticate, ctrl.getOrderById);

/**
 * @swagger
 * /medications/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status (pharmacist)
 *     tags: [Medications & Orders]
 */
router.patch('/orders/:orderId/status', authenticate, authorize('pharmacist'), ctrl.updateOrderStatus);

/**
 * @swagger
 * /medications/orders/{orderId}/cancel:
 *   patch:
 *     summary: Cancel an order (patient)
 *     tags: [Medications & Orders]
 */
router.patch('/orders/:orderId/cancel', authenticate, authorize('patient'), ctrl.cancelOrder);

// ─── Medication CRUD — wildcard AFTER all named routes ───
/**
 * @swagger
 * /medications:
 *   post:
 *     summary: Add a medication to inventory (pharmacist)
 *     tags: [Medications & Orders]
 */
router.post('/', authenticate, authorize('pharmacist'), upload.single('image'), ctrl.addMedication);

/**
 * @swagger
 * /medications/{medicationId}:
 *   patch:
 *     summary: Update a medication
 *     tags: [Medications & Orders]
 *   delete:
 *     summary: Delete a medication
 *     tags: [Medications & Orders]
 */
router.patch('/:medicationId', authenticate, authorize('pharmacist'), ctrl.updateMedication);
router.delete('/:medicationId', authenticate, authorize('pharmacist'), ctrl.deleteMedication);

module.exports = router;
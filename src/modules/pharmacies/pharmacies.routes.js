const express = require('express');
const router = express.Router();
const ctrl = require('./pharmacies.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { upload } = require('../../utils/upload');

/**
 * @swagger
 * tags:
 *   name: Pharmacies
 *   description: Pharmacy profiles and search
 */

/**
 * @swagger
 * /pharmacies/search:
 *   get:
 *     summary: Search pharmacies by city, delivery, name
 *     tags: [Pharmacies]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: delivery
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of pharmacies
 */
router.get('/search', ctrl.searchPharmacies);

/**
 * @swagger
 * /pharmacies/me/profile:
 *   get:
 *     summary: Get my pharmacy profile
 *     tags: [Pharmacies]
 *   patch:
 *     summary: Update my pharmacy profile
 *     tags: [Pharmacies]
 */
router.get('/me/profile', authenticate, authorize('pharmacist'), ctrl.getMyProfile);
router.patch('/me/profile', authenticate, authorize('pharmacist'), ctrl.upsertProfile);

/**
 * @swagger
 * /pharmacies/me/logo:
 *   patch:
 *     summary: Upload or update pharmacy logo
 *     tags: [Pharmacies]
 */
router.patch('/me/logo', authenticate, authorize('pharmacist'), upload.single('logo'), ctrl.updateLogo);

/**
 * @swagger
 * /pharmacies/{pharmacyId}:
 *   get:
 *     summary: Get a pharmacy's public profile
 *     tags: [Pharmacies]
 *     security: []
 */
router.get('/:pharmacyId', ctrl.getPharmacyById);

/**
 * @swagger
 * /pharmacies/{pharmacyId}/verify:
 *   patch:
 *     summary: Verify a pharmacy (admin only)
 *     tags: [Pharmacies]
 */
router.patch('/:pharmacyId/verify', authenticate, authorize('admin'), ctrl.verifyPharmacy);

module.exports = router;
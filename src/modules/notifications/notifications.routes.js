const express = require('express');
const router = express.Router();
const ctrl = require('./notifications.controller');
const authenticate = require('../../middleware/authenticate');
const { body } = require('express-validator');
const validate = require('../../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app and push notification management
 */

router.use(authenticate);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get my notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean }
 */
router.get('/', ctrl.getMyNotifications);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 */
router.patch('/read-all', ctrl.markAllAsRead);

/**
 * @swagger
 * /notifications/fcm-token:
 *   patch:
 *     summary: Update Firebase device token
 *     tags: [Notifications]
 */
router.patch('/fcm-token', [body('fcmToken').notEmpty()], validate, ctrl.updateFcmToken);

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 */
router.patch('/:notificationId/read', ctrl.markAsRead);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 */
router.delete('/:notificationId', ctrl.deleteNotification);

module.exports = router;
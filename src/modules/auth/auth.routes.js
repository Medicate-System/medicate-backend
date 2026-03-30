const express = require('express');
const router = express.Router();

const controller = require('./auth.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('./auth.validator');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & identity management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user (patient, doctor, or pharmacist)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, role]
 *             properties:
 *               firstName: { type: string, example: Jean }
 *               lastName:  { type: string, example: Dupont }
 *               email:     { type: string, example: jean@example.com }
 *               password:  { type: string, example: SecurePass1 }
 *               role:      { type: string, enum: [patient, doctor, pharmacist] }
 *               phone:     { type: string, example: "+250780000000" }
 *     responses:
 *       201:
 *         description: Account created successfully
 *       409:
 *         description: Email already in use
 */
router.post('/register', registerValidator, validate, controller.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive JWT tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string }
 *               password: { type: string }
 *               fcmToken: { type: string, description: Firebase device token }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginValidator, validate, controller.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     security: []
 */
router.post('/refresh', controller.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate tokens
 *     tags: [Auth]
 */
router.post('/logout', authenticate, controller.logout);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     security: []
 */
router.post('/forgot-password', forgotPasswordValidator, validate, controller.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token from email
 *     tags: [Auth]
 *     security: []
 */
router.post('/reset-password', resetPasswordValidator, validate, controller.resetPassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 */
router.get('/me', authenticate, controller.getMe);

module.exports = router;
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../../models').User;
const { AppError } = require('../../utils/AppError');
const { cacheSet, cacheDel } = require('../../config/redis');
const { sendEmail } = require('../../utils/email');
const logger = require('../../utils/logger');

// ─── Token Generators ─────────────────────────────────────
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

// ─── Register ─────────────────────────────────────────────
const register = async ({ firstName, lastName, email, phone, password, role }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError('Email already in use', 409);

  const user = await User.create({ firstName, lastName, email, phone, password, role });

  // Send welcome / verification email
  await sendEmail({
    to: email,
    subject: 'Welcome to HealthcarePlatform — Verify your account',
    template: 'welcome',
    data: { firstName, verificationLink: `${process.env.CLIENT_URL}/verify?id=${user.id}` },
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Persist refresh token in DB
  await user.update({ refreshToken });

  return { user: user.toSafeObject(), accessToken, refreshToken };
};

// ─── Login ────────────────────────────────────────────────
const login = async ({ email, password, fcmToken }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('Account has been deactivated', 403);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await user.update({
    refreshToken,
    lastLoginAt: new Date(),
    ...(fcmToken && { fcmToken }),
  });

  return { user: user.toSafeObject(), accessToken, refreshToken };
};

// ─── Refresh Token ────────────────────────────────────────
const refreshToken = async (token) => {
  if (!token) throw new AppError('Refresh token required', 400);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findOne({ where: { id: decoded.id, refreshToken: token } });
  if (!user) throw new AppError('Refresh token is invalid', 401);

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  await user.update({ refreshToken: newRefreshToken });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// ─── Logout ───────────────────────────────────────────────
const logout = async (userId, accessToken) => {
  await User.update({ refreshToken: null, fcmToken: null }, { where: { id: userId } });

  // Blacklist the access token for its remaining TTL
  const decoded = jwt.decode(accessToken);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) await cacheSet(`blacklist:${accessToken}`, true, ttl);
};

// ─── Forgot Password ──────────────────────────────────────
const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });
  // Always respond the same way to prevent email enumeration
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  await user.update({
    passwordResetToken: hashedToken,
    passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 min
  });

  await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    template: 'resetPassword',
    data: {
      firstName: user.firstName,
      resetLink: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
    },
  });
};

// ─── Reset Password ───────────────────────────────────────
const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    where: {
      passwordResetToken: hashedToken,
    },
  });

  if (!user || new Date() > user.passwordResetExpires) {
    throw new AppError('Reset token is invalid or has expired', 400);
  }

  await user.update({
    password: newPassword,
    passwordResetToken: null,
    passwordResetExpires: null,
    refreshToken: null, // force re-login everywhere
  });
};

// ─── Get Current User ─────────────────────────────────────
const getMe = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);
  return user.toSafeObject();
};

module.exports = { register, login, refreshToken, logout, forgotPassword, resetPassword, getMe };
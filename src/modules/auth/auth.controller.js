const authService = require('./auth.service');
const { success, created } = require('../../utils/apiResponse');

const register = async (req, res) => {
  const result = await authService.register(req.body);
  created(res, result, 'Account created successfully');
};

const login = async (req, res) => {
  const { email, password, fcmToken } = req.body;
  const result = await authService.login({ email, password, fcmToken });

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  success(res, { user: result.user, accessToken: result.accessToken }, 'Login successful');
};

const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  const result = await authService.refreshToken(token);
  success(res, result, 'Token refreshed');
};

const logout = async (req, res) => {
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.split(' ')[1];
  await authService.logout(req.user.id, accessToken);
  res.clearCookie('refreshToken');
  success(res, null, 'Logged out successfully');
};

const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.body.email);
  success(res, null, 'If that email exists, a reset link has been sent');
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  success(res, null, 'Password reset successfully');
};

const getMe = async (req, res) => {
  const user = await authService.getMe(req.user.id);
  success(res, user);
};

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, getMe };
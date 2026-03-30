const { Op } = require('sequelize');
const User = require('../../models').User;
const Notification = require('../../models').Notification;
const { sendPushNotification, sendMulticastNotification } = require('../../config/firebase');
const { AppError } = require('../../utils/AppError');
const { paginate, paginateMeta } = require('../../utils/pagination');

// ─── Create & send notification ───────────────────────────
const sendNotification = async ({ userId, title, body, type, referenceId, referenceType }) => {
  // Persist in DB
  const notification = await Notification.create({ userId, title, body, type, referenceId, referenceType });

  // Push to device if FCM token exists
  const user = await User.findByPk(userId, { attributes: ['fcmToken'] });
  if (user?.fcmToken) {
    await sendPushNotification({ token: user.fcmToken, title, body, data: { referenceId, referenceType } });
  }

  return notification;
};

// ─── Broadcast to multiple users ─────────────────────────
const broadcastNotification = async ({ userIds, title, body, type }) => {
  const users = await User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: ['id', 'fcmToken'] });

  // Persist for all
  await Notification.bulkCreate(userIds.map((userId) => ({ userId, title, body, type })));

  // Send push to those with tokens
  const tokens = users.map((u) => u.fcmToken).filter(Boolean);
  if (tokens.length > 0) {
    await sendMulticastNotification({ tokens, title, body });
  }
};

// ─── Get my notifications ─────────────────────────────────
const getMyNotifications = async (userId, query) => {
  const { page, limit, offset } = paginate(query);
  const { unreadOnly } = query;

  const where = { userId };
  if (unreadOnly === 'true') where.isRead = false;

  const { count, rows } = await Notification.findAndCountAll({
    where, limit, offset, order: [['createdAt', 'DESC']],
  });

  const unreadCount = await Notification.count({ where: { userId, isRead: false } });

  return {
    notifications: rows,
    unreadCount,
    meta: paginateMeta(count, page, limit),
  };
};

// ─── Mark as read ─────────────────────────────────────────
const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({ where: { id: notificationId, userId } });
  if (!notification) throw new AppError('Notification not found', 404);
  await notification.update({ isRead: true, readAt: new Date() });
  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { userId, isRead: false } }
  );
};

// ─── Delete notification ──────────────────────────────────
const deleteNotification = async (userId, notificationId) => {
  const notification = await Notification.findOne({ where: { id: notificationId, userId } });
  if (!notification) throw new AppError('Notification not found', 404);
  await notification.destroy();
};

// ─── Update FCM token ─────────────────────────────────────
const updateFcmToken = async (userId, fcmToken) => {
  await User.update({ fcmToken }, { where: { id: userId } });
};

module.exports = {
  sendNotification, broadcastNotification, getMyNotifications,
  markAsRead, markAllAsRead, deleteNotification, updateFcmToken,
};
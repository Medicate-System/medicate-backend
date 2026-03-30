const service = require('./notifications.service');
const { success, paginated } = require('../../utils/apiResponse');

const getMyNotifications = async (req, res) => {
  const { notifications, unreadCount, meta } = await service.getMyNotifications(req.user.id, req.query);
  res.status(200).json({ success: true, data: notifications, unreadCount, meta });
};
const markAsRead         = async (req, res) => success(res, await service.markAsRead(req.user.id, req.params.notificationId), 'Marked as read');
const markAllAsRead      = async (req, res) => { await service.markAllAsRead(req.user.id); success(res, null, 'All notifications marked as read'); };
const deleteNotification = async (req, res) => { await service.deleteNotification(req.user.id, req.params.notificationId); success(res, null, 'Notification deleted'); };
const updateFcmToken     = async (req, res) => { await service.updateFcmToken(req.user.id, req.body.fcmToken); success(res, null, 'FCM token updated'); };

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification, updateFcmToken };
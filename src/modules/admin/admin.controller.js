const service = require('./admin.service');
const { success, paginated } = require('../../utils/apiResponse');

const getDashboardStats        = async (req, res) => success(res, await service.getDashboardStats());
const getAllUsers               = async (req, res) => { const { users, meta } = await service.getAllUsers(req.query); paginated(res, users, meta); };
const toggleUserStatus         = async (req, res) => success(res, await service.toggleUserStatus(req.params.userId), 'User status toggled');
const getPendingVerifications  = async (req, res) => success(res, await service.getPendingVerifications(req.params.type));
const getAppointmentStats      = async (req, res) => success(res, await service.getAppointmentStats());
const getOrderStats            = async (req, res) => success(res, await service.getOrderStats());
const sendBroadcast            = async (req, res) => success(res, await service.sendBroadcast(req.body), 'Broadcast sent');

module.exports = {
  getDashboardStats, getAllUsers, toggleUserStatus,
  getPendingVerifications, getAppointmentStats, getOrderStats, sendBroadcast,
};
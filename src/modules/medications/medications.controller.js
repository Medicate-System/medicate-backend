const service = require('./medications.service');
const { success, created, paginated } = require('../../utils/apiResponse');
const { upload } = require('../../utils/upload');

const addMedication     = async (req, res) => created(res, await service.addMedication(req.user.id, req.body, req.file?.buffer), 'Medication added');
const updateMedication  = async (req, res) => success(res, await service.updateMedication(req.user.id, req.params.medicationId, req.body), 'Medication updated');
const deleteMedication  = async (req, res) => { await service.deleteMedication(req.user.id, req.params.medicationId); success(res, null, 'Medication deleted'); };
const searchMedications = async (req, res) => { const { medications, meta } = await service.searchMedications(req.query); paginated(res, medications, meta); };
const placeOrder        = async (req, res) => created(res, await service.placeOrder(req.user.id, req.body), 'Order placed successfully');
const getMyOrders       = async (req, res) => { const { orders, meta } = await service.getMyOrders(req.user.id, req.query); paginated(res, orders, meta); };
const getPharmacyOrders = async (req, res) => { const { orders, meta } = await service.getPharmacyOrders(req.user.id, req.query); paginated(res, orders, meta); };
const getOrderById      = async (req, res) => success(res, await service.getOrderById(req.params.orderId, req.user.id));
const updateOrderStatus = async (req, res) => success(res, await service.updateOrderStatus(req.user.id, req.params.orderId, req.body.status, req.body, req.io), 'Status updated');
const cancelOrder       = async (req, res) => success(res, await service.cancelOrder(req.user.id, req.params.orderId, req.body.reason), 'Order cancelled');

module.exports = {
  addMedication, updateMedication, deleteMedication, searchMedications,
  placeOrder, getMyOrders, getPharmacyOrders, getOrderById, updateOrderStatus, cancelOrder,
};
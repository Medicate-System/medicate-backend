const patientsService = require('./patients.service');
const { success, created, paginated } = require('../../utils/apiResponse');

const getMyProfile = async (req, res) => {
  const data = await patientsService.getMyProfile(req.user.id);
  success(res, data);
};

const updateProfile = async (req, res) => {
  const data = await patientsService.updateProfile(req.user.id, req.body);
  success(res, data, 'Profile updated successfully');
};

const updateAvatar = async (req, res) => {
  if (!req.file) throw new Error('No file uploaded');
  const data = await patientsService.updateAvatar(req.user.id, req.file.buffer);
  success(res, data, 'Avatar updated successfully');
};

const getAddresses = async (req, res) => {
  const data = await patientsService.getAddresses(req.user.id);
  success(res, data);
};

const addAddress = async (req, res) => {
  const data = await patientsService.addAddress(req.user.id, req.body);
  created(res, data, 'Address added successfully');
};

const updateAddress = async (req, res) => {
  const data = await patientsService.updateAddress(req.user.id, req.params.addressId, req.body);
  success(res, data, 'Address updated successfully');
};

const deleteAddress = async (req, res) => {
  await patientsService.deleteAddress(req.user.id, req.params.addressId);
  success(res, null, 'Address deleted successfully');
};

// ─── Admin Controllers ────────────────────────────────────
const getAllPatients = async (req, res) => {
  const { patients, meta } = await patientsService.getAllPatients(req.query);
  paginated(res, patients, meta);
};

const getPatientById = async (req, res) => {
  const data = await patientsService.getPatientById(req.params.patientId);
  success(res, data);
};

module.exports = {
  getMyProfile,
  updateProfile,
  updateAvatar,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getAllPatients,
  getPatientById,
};
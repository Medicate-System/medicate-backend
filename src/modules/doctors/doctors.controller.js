const service = require('./doctors.service');
const { success, created, paginated } = require('../../utils/apiResponse');

const getMyProfile   = async (req, res) => success(res, await service.getMyProfile(req.user.id));
const upsertProfile  = async (req, res) => success(res, await service.upsertProfile(req.user.id, req.body), 'Profile updated');
const addClinic      = async (req, res) => created(res, await service.addClinic(req.user.id, req.body), 'Clinic added');
const updateClinic   = async (req, res) => success(res, await service.updateClinic(req.user.id, req.params.clinicId, req.body), 'Clinic updated');
const deleteClinic   = async (req, res) => { await service.deleteClinic(req.user.id, req.params.clinicId); success(res, null, 'Clinic deleted'); };
const setSchedule    = async (req, res) => success(res, await service.setSchedule(req.user.id, req.body), 'Schedule saved');
const deleteSchedule = async (req, res) => { await service.deleteSchedule(req.user.id, req.params.scheduleId); success(res, null, 'Schedule deleted'); };
const searchDoctors  = async (req, res) => { const { doctors, meta } = await service.searchDoctors(req.query); paginated(res, doctors, meta); };
const getDoctorById  = async (req, res) => success(res, await service.getDoctorById(req.params.doctorId));
const addReview      = async (req, res) => created(res, await service.addReview(req.user.id, req.params.doctorId, req.body), 'Review submitted');
const toggleAvailability = async (req, res) => success(res, await service.toggleAvailability(req.user.id), 'Availability updated');
const verifyDoctor   = async (req, res) => success(res, await service.verifyDoctor(req.params.doctorId), 'Doctor verified');

module.exports = {
  getMyProfile, upsertProfile, addClinic, updateClinic, deleteClinic,
  setSchedule, deleteSchedule, searchDoctors, getDoctorById,
  addReview, toggleAvailability, verifyDoctor,
};
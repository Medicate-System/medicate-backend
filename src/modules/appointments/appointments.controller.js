const service = require('./appointments.service');
const { success, created, paginated } = require('../../utils/apiResponse');

const getAvailableSlots    = async (req, res) => success(res, await service.getAvailableSlots(req.params.doctorId, req.query.date));
const bookAppointment      = async (req, res) => created(res, await service.bookAppointment(req.user.id, req.body), 'Appointment booked');
const getMyAppointments    = async (req, res) => { const { appointments, meta } = await service.getMyAppointments(req.user.id, req.query); paginated(res, appointments, meta); };
const getDoctorAppointments = async (req, res) => { const { appointments, meta } = await service.getDoctorAppointments(req.user.id, req.query); paginated(res, appointments, meta); };
const updateStatus         = async (req, res) => success(res, await service.updateStatus(req.user.id, req.user.role, req.params.appointmentId, req.body.status, req.body), 'Status updated');
const getAppointmentById   = async (req, res) => success(res, await service.getAppointmentById(req.user.id, req.user.role, req.params.appointmentId));

module.exports = { getAvailableSlots, bookAppointment, getMyAppointments, getDoctorAppointments, updateStatus, getAppointmentById };
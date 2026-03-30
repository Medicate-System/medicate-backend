const { Op } = require('sequelize');
const moment = require('moment');
const User = require('../../models').User;
const Doctor = require('../../models').Doctor;
const DoctorSchedule = require('../../models').DoctorSchedule;
const DoctorClinic = require('../../models').DoctorClinic;
const Appointment = require('../../models').Appointment;
const { AppError } = require('../../utils/AppError');
const { sendEmail } = require('../../utils/email');
const { sendPushNotification } = require('../../config/firebase');
const { paginate, paginateMeta } = require('../../utils/pagination');

const SAFE_USER = { exclude: ['password', 'refreshToken', 'passwordResetToken'] };

// ─── Get available slots for a doctor on a date ───────────
const getAvailableSlots = async (doctorId, date) => {
  const dayOfWeek = moment(date).format('dddd').toLowerCase();

  const schedule = await DoctorSchedule.findOne({
    where: { doctorId, dayOfWeek, isActive: true },
  });
  if (!schedule) return [];

  const existingAppointments = await Appointment.findAll({
    where: { doctorId, appointmentDate: date, status: { [Op.notIn]: ['cancelled'] } },
    attributes: ['startTime'],
  });
  const bookedTimes = existingAppointments.map((a) => a.startTime);

  // Generate slots
  const slots = [];
  let current = moment(`${date} ${schedule.startTime}`, 'YYYY-MM-DD HH:mm:ss');
  const end = moment(`${date} ${schedule.endTime}`, 'YYYY-MM-DD HH:mm:ss');

  while (current.clone().add(schedule.slotDurationMinutes, 'minutes').isSameOrBefore(end)) {
    const timeStr = current.format('HH:mm:ss');
    if (!bookedTimes.includes(timeStr)) {
      slots.push({
        startTime: timeStr,
        endTime: current.clone().add(schedule.slotDurationMinutes, 'minutes').format('HH:mm:ss'),
        available: true,
      });
    }
    current.add(schedule.slotDurationMinutes, 'minutes');
  }

  return slots;
};

// ─── Book Appointment ─────────────────────────────────────
const bookAppointment = async (patientId, data) => {
  const { doctorId, clinicId, appointmentDate, startTime, type, reasonForVisit, symptoms } = data;

  // Validate date is not in the past
  if (moment(appointmentDate).isBefore(moment().startOf('day'))) {
    throw new AppError('Cannot book an appointment in the past', 400);
  }

  // Check slot is actually available
  const slots = await getAvailableSlots(doctorId, appointmentDate);
  const slot = slots.find((s) => s.startTime === startTime);
  if (!slot) throw new AppError('This time slot is not available', 409);

  const doctor = await Doctor.findByPk(doctorId, {
    include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'fcmToken'] }],
  });
  if (!doctor) throw new AppError('Doctor not found', 404);
  if (!doctor.isAvailable) throw new AppError('Doctor is currently not accepting appointments', 400);

  const appointment = await Appointment.create({
    patientId, doctorId, clinicId, appointmentDate,
    startTime: slot.startTime, endTime: slot.endTime,
    type, reasonForVisit, symptoms,
    fee: doctor.consultationFee,
    status: 'pending',
  });

  // Notify doctor
  if (doctor.user.fcmToken) {
    await sendPushNotification({
      token: doctor.user.fcmToken,
      title: 'New Appointment Request',
      body: `You have a new appointment request for ${appointmentDate} at ${startTime}`,
      data: { appointmentId: appointment.id },
    });
  }

  const patient = await User.findByPk(patientId, { attributes: ['firstName', 'lastName', 'email'] });
  await sendEmail({
    to: patient.email,
    template: 'appointmentConfirmation',
    data: {
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorName: `${doctor.user.firstName} ${doctor.user.lastName}`,
      date: appointmentDate,
      time: startTime,
    },
  });

  return appointment;
};

// ─── Get My Appointments (patient) ───────────────────────
const getMyAppointments = async (userId, query) => {
  const { page, limit, offset } = paginate(query);
  const { status, upcoming } = query;

  const where = { patientId: userId };
  if (status) where.status = status;
  if (upcoming === 'true') {
    where.appointmentDate = { [Op.gte]: moment().format('YYYY-MM-DD') };
    where.status = { [Op.in]: ['pending', 'confirmed'] };
  }

  const { count, rows } = await Appointment.findAndCountAll({
    where, limit, offset,
    order: [['appointmentDate', 'ASC'], ['startTime', 'ASC']],
    include: [
      { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user', attributes: SAFE_USER }] },
      { model: DoctorClinic, as: 'clinic' },
    ],
  });

  return { appointments: rows, meta: paginateMeta(count, page, limit) };
};

// ─── Get Doctor's Appointments ────────────────────────────
const getDoctorAppointments = async (userId, query) => {
  const { page, limit, offset } = paginate(query);
  const { status, date } = query;

  const doctor = await Doctor.findOne({ where: { userId } });
  if (!doctor) throw new AppError('Doctor profile not found', 404);

  const where = { doctorId: doctor.id };
  if (status) where.status = status;
  if (date) where.appointmentDate = date;

  const { count, rows } = await Appointment.findAndCountAll({
    where, limit, offset,
    order: [['appointmentDate', 'ASC'], ['startTime', 'ASC']],
    include: [{ model: User, as: 'patient', attributes: SAFE_USER }],
  });

  return { appointments: rows, meta: paginateMeta(count, page, limit) };
};

// ─── Update Appointment Status ────────────────────────────
const updateStatus = async (userId, role, appointmentId, status, extra = {}) => {
  const appointment = await Appointment.findByPk(appointmentId, {
    include: [
      { model: User, as: 'patient', attributes: ['email', 'firstName', 'fcmToken'] },
      { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user', attributes: ['fcmToken'] }] },
    ],
  });
  if (!appointment) throw new AppError('Appointment not found', 404);

  // Auth check
  const isPatient = role === 'patient' && appointment.patientId === userId;
  const isDoctor = role === 'doctor';
  const isAdmin = role === 'admin';
  if (!isPatient && !isDoctor && !isAdmin) throw new AppError('Not authorized', 403);

  const updates = { status };
  if (status === 'cancelled') {
    updates.cancellationReason = extra.cancellationReason;
    updates.cancelledBy = role;
  }
  if (status === 'completed') {
    updates.notes = extra.notes;
    updates.diagnosis = extra.diagnosis;
    updates.followUpDate = extra.followUpDate;
  }

  await appointment.update(updates);

  // Notify patient of status change
  if (appointment.patient.fcmToken) {
    await sendPushNotification({
      token: appointment.patient.fcmToken,
      title: 'Appointment Update',
      body: `Your appointment has been ${status}`,
      data: { appointmentId },
    });
  }

  return appointment;
};

// ─── Get Single Appointment ───────────────────────────────
const getAppointmentById = async (userId, role, appointmentId) => {
  const appointment = await Appointment.findByPk(appointmentId, {
    include: [
      { model: User, as: 'patient', attributes: SAFE_USER },
      { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user', attributes: SAFE_USER }] },
      { model: DoctorClinic, as: 'clinic' },
    ],
  });
  if (!appointment) throw new AppError('Appointment not found', 404);

  const isOwner = appointment.patientId === userId;
  const isDoctor = role === 'doctor';
  const isAdmin = role === 'admin';
  if (!isOwner && !isDoctor && !isAdmin) throw new AppError('Not authorized', 403);

  return appointment;
};

module.exports = {
  getAvailableSlots, bookAppointment, getMyAppointments,
  getDoctorAppointments, updateStatus, getAppointmentById,
};
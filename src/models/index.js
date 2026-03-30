const { sequelize } = require('../config/database');

// ─── Import all models ────────────────────────────────────
const User                = require('./user.model');
const Patient             = require('./patient.model');
const PatientAddress      = require('./patientAddress.model');
const Doctor              = require('./doctor.model');
const DoctorClinic        = require('./doctorClinic.model');
const DoctorSchedule      = require('./doctorSchedule.model');
const DoctorReview        = require('./doctorReview.model');
const Pharmacy            = require('./pharmacy.model');
const Appointment         = require('./appointment.model');
const Prescription        = require('./prescription.model');
const PrescriptionItem    = require('./prescriptionItem.model');
const Medication          = require('./medication.model');
const Order               = require('./order.model');
const OrderItem           = require('./orderItem.model');
const Notification        = require('./notification.model');

// ─── Associations ─────────────────────────────────────────

// User ↔ Patient
User.hasOne(Patient, { foreignKey: 'userId', as: 'patientProfile' });
Patient.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Patient ↔ PatientAddress
Patient.hasMany(PatientAddress, { foreignKey: 'patientId', as: 'addresses' });
PatientAddress.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

// User ↔ Doctor
User.hasOne(Doctor, { foreignKey: 'userId', as: 'doctorProfile' });
Doctor.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Doctor ↔ DoctorClinic
Doctor.hasMany(DoctorClinic, { foreignKey: 'doctorId', as: 'clinics' });
DoctorClinic.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

// Doctor ↔ DoctorSchedule
Doctor.hasMany(DoctorSchedule, { foreignKey: 'doctorId', as: 'schedules' });
DoctorSchedule.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
DoctorSchedule.belongsTo(DoctorClinic, { foreignKey: 'clinicId', as: 'clinic' });

// Doctor ↔ DoctorReview
Doctor.hasMany(DoctorReview, { foreignKey: 'doctorId', as: 'reviews' });
DoctorReview.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
DoctorReview.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });

// User ↔ Pharmacy
User.hasOne(Pharmacy, { foreignKey: 'userId', as: 'pharmacyProfile' });
Pharmacy.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Appointment
Appointment.belongsTo(User,        { foreignKey: 'patientId', as: 'patient' });
Appointment.belongsTo(Doctor,      { foreignKey: 'doctorId',  as: 'doctor'  });
Appointment.belongsTo(DoctorClinic,{ foreignKey: 'clinicId',  as: 'clinic'  });

// Prescription
Prescription.belongsTo(User,        { foreignKey: 'patientId',     as: 'patient'     });
Prescription.belongsTo(Doctor,      { foreignKey: 'doctorId',      as: 'doctor',      constraints: false });
Prescription.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment', constraints: false });
Prescription.hasMany(PrescriptionItem, { foreignKey: 'prescriptionId', as: 'items' });
PrescriptionItem.belongsTo(Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });

// Medication
Pharmacy.hasMany(Medication, { foreignKey: 'pharmacyId', as: 'medications' });
Medication.belongsTo(Pharmacy, { foreignKey: 'pharmacyId', as: 'pharmacy' });

// Order
Order.belongsTo(User,        { foreignKey: 'patientId',      as: 'patient'      });
Order.belongsTo(Pharmacy,    { foreignKey: 'pharmacyId',     as: 'pharmacy'     });
Order.belongsTo(Prescription,{ foreignKey: 'prescriptionId', as: 'prescription', constraints: false });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order,       { foreignKey: 'orderId',       as: 'order'      });
OrderItem.belongsTo(Medication,  { foreignKey: 'medicationId',  as: 'medication' });

// Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Patient,
  PatientAddress,
  Doctor,
  DoctorClinic,
  DoctorSchedule,
  DoctorReview,
  Pharmacy,
  Appointment,
  Prescription,
  PrescriptionItem,
  Medication,
  Order,
  OrderItem,
  Notification,
};
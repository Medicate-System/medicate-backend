const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId:       { type: DataTypes.UUID, allowNull: false },
  doctorId:        { type: DataTypes.UUID, allowNull: false },
  clinicId:        { type: DataTypes.UUID, allowNull: true  },
  appointmentDate: { type: DataTypes.DATEONLY, allowNull: false },
  startTime:       { type: DataTypes.TIME,     allowNull: false },
  endTime:         { type: DataTypes.TIME,     allowNull: false },
  status: {
    type: DataTypes.ENUM('pending','confirmed','cancelled','completed','no_show'),
    defaultValue: 'pending',
  },
  type: {
    type: DataTypes.ENUM('in_person','telemedicine'),
    defaultValue: 'in_person',
  },
  reasonForVisit:     { type: DataTypes.TEXT,    allowNull: true },
  symptoms:           { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  notes:              { type: DataTypes.TEXT,    allowNull: true },
  diagnosis:          { type: DataTypes.TEXT,    allowNull: true },
  followUpDate:       { type: DataTypes.DATEONLY, allowNull: true },
  cancellationReason: { type: DataTypes.STRING,  allowNull: true },
  cancelledBy:        { type: DataTypes.ENUM('patient','doctor','system'), allowNull: true },
  reminderSent:       { type: DataTypes.BOOLEAN, defaultValue: false },
  meetingLink:        { type: DataTypes.STRING,  allowNull: true },
  fee:                { type: DataTypes.DECIMAL(10,2), allowNull: true },
  isPaid:             { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'appointments', timestamps: true });

module.exports = Appointment;
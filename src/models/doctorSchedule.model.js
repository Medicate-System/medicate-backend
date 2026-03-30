const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DoctorSchedule = sequelize.define('DoctorSchedule', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  doctorId: { type: DataTypes.UUID, allowNull: false },
  clinicId: { type: DataTypes.UUID, allowNull: true  },
  dayOfWeek: {
    type: DataTypes.ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday'),
    allowNull: false,
  },
  startTime:            { type: DataTypes.TIME,    allowNull: false },
  endTime:              { type: DataTypes.TIME,    allowNull: false },
  slotDurationMinutes:  { type: DataTypes.INTEGER, defaultValue: 30 },
  maxPatients:          { type: DataTypes.INTEGER, defaultValue: 10 },
  isActive:             { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'doctor_schedules', timestamps: true });

module.exports = DoctorSchedule;
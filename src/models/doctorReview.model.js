const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DoctorReview = sequelize.define('DoctorReview', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  doctorId:      { type: DataTypes.UUID, allowNull: false },
  patientId:     { type: DataTypes.UUID, allowNull: false },
  appointmentId: { type: DataTypes.UUID, allowNull: true  },
  rating:        { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment:       { type: DataTypes.TEXT,    allowNull: true  },
  isAnonymous:   { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'doctor_reviews', timestamps: true });

module.exports = DoctorReview;
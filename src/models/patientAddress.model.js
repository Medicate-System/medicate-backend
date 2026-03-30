const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PatientAddress = sequelize.define('PatientAddress', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID, allowNull: false },
  label:     { type: DataTypes.ENUM('home', 'work', 'other'), defaultValue: 'home' },
  street:    { type: DataTypes.STRING, allowNull: false },
  city:      { type: DataTypes.STRING, allowNull: false },
  district:  { type: DataTypes.STRING, allowNull: true  },
  country:   { type: DataTypes.STRING, allowNull: false, defaultValue: 'Rwanda' },
  latitude:  { type: DataTypes.FLOAT,  allowNull: true },
  longitude: { type: DataTypes.FLOAT,  allowNull: true },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'patient_addresses', timestamps: true });

module.exports = PatientAddress;
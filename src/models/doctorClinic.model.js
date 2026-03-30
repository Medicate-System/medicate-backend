const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DoctorClinic = sequelize.define('DoctorClinic', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  doctorId:  { type: DataTypes.UUID, allowNull: false },
  name:      { type: DataTypes.STRING, allowNull: false },
  street:    { type: DataTypes.STRING, allowNull: false },
  city:      { type: DataTypes.STRING, allowNull: false },
  district:  { type: DataTypes.STRING, allowNull: true  },
  country:   { type: DataTypes.STRING, defaultValue: 'Rwanda' },
  latitude:  { type: DataTypes.FLOAT,  allowNull: true },
  longitude: { type: DataTypes.FLOAT,  allowNull: true },
  phone:     { type: DataTypes.STRING, allowNull: true },
  isPrimary: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'doctor_clinics', timestamps: true });

module.exports = DoctorClinic;
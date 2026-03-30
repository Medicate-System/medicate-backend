const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Patient = sequelize.define('Patient', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:   { type: DataTypes.UUID, allowNull: false, unique: true },
  dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    allowNull: true,
  },
  bloodGroup: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: true,
  },
  height:   { type: DataTypes.FLOAT, allowNull: true },
  weight:   { type: DataTypes.FLOAT, allowNull: true },
  allergies:           { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  chronicConditions:   { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  currentMedications:  { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  emergencyContactName:     { type: DataTypes.STRING, allowNull: true },
  emergencyContactPhone:    { type: DataTypes.STRING, allowNull: true },
  emergencyContactRelation: { type: DataTypes.STRING, allowNull: true },
  insuranceProvider: { type: DataTypes.STRING, allowNull: true },
  insuranceNumber:   { type: DataTypes.STRING, allowNull: true },
  notes:             { type: DataTypes.TEXT,   allowNull: true },
}, { tableName: 'patients', timestamps: true });

module.exports = Patient;
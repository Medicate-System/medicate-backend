const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Doctor = sequelize.define('Doctor', {
  id:                 { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:             { type: DataTypes.UUID, allowNull: false, unique: true },
  specialization:     { type: DataTypes.STRING, allowNull: false },
  subSpecializations: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  licenseNumber:      { type: DataTypes.STRING, allowNull: false, unique: true },
  yearsOfExperience:  { type: DataTypes.INTEGER, allowNull: true },
  qualifications:     { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  languages:          { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: ['English'] },
  bio:                { type: DataTypes.TEXT,    allowNull: true },
  consultationFee:    { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  isVerified:         { type: DataTypes.BOOLEAN, defaultValue: false },
  isAvailable:        { type: DataTypes.BOOLEAN, defaultValue: true  },
  averageRating:      { type: DataTypes.FLOAT,   defaultValue: 0 },
  totalReviews:       { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'doctors', timestamps: true });

module.exports = Doctor;
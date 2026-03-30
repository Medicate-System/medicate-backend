const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pharmacy = sequelize.define('Pharmacy', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:        { type: DataTypes.UUID, allowNull: false, unique: true },
  name:          { type: DataTypes.STRING, allowNull: false },
  licenseNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  description:   { type: DataTypes.TEXT,   allowNull: true  },
  street:        { type: DataTypes.STRING, allowNull: false },
  city:          { type: DataTypes.STRING, allowNull: false },
  district:      { type: DataTypes.STRING, allowNull: true  },
  country:       { type: DataTypes.STRING, defaultValue: 'Rwanda' },
  latitude:      { type: DataTypes.FLOAT,  allowNull: true },
  longitude:     { type: DataTypes.FLOAT,  allowNull: true },
  phone:         { type: DataTypes.STRING, allowNull: true },
  email:         { type: DataTypes.STRING, allowNull: true },
  openingTime:   { type: DataTypes.TIME,   allowNull: true },
  closingTime:   { type: DataTypes.TIME,   allowNull: true },
  workingDays:   { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: ['monday','tuesday','wednesday','thursday','friday'] },
  deliveryAvailable:    { type: DataTypes.BOOLEAN,       defaultValue: true },
  deliveryRadiusKm:     { type: DataTypes.FLOAT,         defaultValue: 10   },
  deliveryFee:          { type: DataTypes.DECIMAL(10,2), defaultValue: 0    },
  minimumOrderAmount:   { type: DataTypes.DECIMAL(10,2), defaultValue: 0    },
  isVerified:    { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive:      { type: DataTypes.BOOLEAN, defaultValue: true  },
  averageRating: { type: DataTypes.FLOAT,   defaultValue: 0 },
  totalReviews:  { type: DataTypes.INTEGER, defaultValue: 0 },
  logo:          { type: DataTypes.STRING,  allowNull: true },
}, { tableName: 'pharmacies', timestamps: true });

module.exports = Pharmacy;
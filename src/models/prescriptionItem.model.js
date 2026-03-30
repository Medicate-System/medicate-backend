const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PrescriptionItem = sequelize.define('PrescriptionItem', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  prescriptionId: { type: DataTypes.UUID, allowNull: false },
  medicationName: { type: DataTypes.STRING, allowNull: false },
  dosage:         { type: DataTypes.STRING, allowNull: false },
  frequency:      { type: DataTypes.STRING, allowNull: false },
  duration:       { type: DataTypes.STRING, allowNull: false },
  quantity:       { type: DataTypes.INTEGER, allowNull: true },
  instructions:   { type: DataTypes.TEXT,   allowNull: true },
  refillsAllowed: { type: DataTypes.INTEGER, defaultValue: 0 },
  refillsUsed:    { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'prescription_items', timestamps: true });

module.exports = PrescriptionItem;
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Medication = sequelize.define('Medication', {
  id:                   { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  pharmacyId:           { type: DataTypes.UUID, allowNull: false },
  name:                 { type: DataTypes.STRING, allowNull: false },
  genericName:          { type: DataTypes.STRING, allowNull: true  },
  brand:                { type: DataTypes.STRING, allowNull: true  },
  category:             { type: DataTypes.STRING, allowNull: true  },
  description:          { type: DataTypes.TEXT,   allowNull: true  },
  dosageForm:           { type: DataTypes.STRING, allowNull: true  },
  strength:             { type: DataTypes.STRING, allowNull: true  },
  price:                { type: DataTypes.DECIMAL(10,2), allowNull: false },
  stockQuantity:        { type: DataTypes.INTEGER, defaultValue: 0 },
  requiresPrescription: { type: DataTypes.BOOLEAN, defaultValue: false },
  imageUrl:             { type: DataTypes.STRING,  allowNull: true  },
  isActive:             { type: DataTypes.BOOLEAN, defaultValue: true },
  expiryDate:           { type: DataTypes.DATEONLY, allowNull: true },
  manufacturer:         { type: DataTypes.STRING,  allowNull: true },
  sideEffects:          { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  contraindications:    { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
}, { tableName: 'medications', timestamps: true });

module.exports = Medication;
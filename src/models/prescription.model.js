const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Prescription = sequelize.define('Prescription', {
  id:                 { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId:          { type: DataTypes.UUID, allowNull: false },
  doctorId:           { type: DataTypes.UUID, allowNull: true  },
  appointmentId:      { type: DataTypes.UUID, allowNull: true  },
  prescriptionNumber: { type: DataTypes.STRING, unique: true   },
  imageUrl:           { type: DataTypes.STRING, allowNull: true },
  pdfUrl:             { type: DataTypes.STRING, allowNull: true },
  diagnosis:          { type: DataTypes.TEXT,   allowNull: true },
  notes:              { type: DataTypes.TEXT,   allowNull: true },
  issuedDate:         { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  expiryDate:         { type: DataTypes.DATEONLY, allowNull: true },
  status: {
    type: DataTypes.ENUM('active','expired','dispensed','cancelled'),
    defaultValue: 'active',
  },
  isUploaded: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'prescriptions',
  timestamps: true,
  hooks: {
    beforeCreate: async (p) => {
      const count = await Prescription.count();
      p.prescriptionNumber = `RX-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
    },
  },
});

module.exports = Prescription;
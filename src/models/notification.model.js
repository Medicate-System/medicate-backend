const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:        { type: DataTypes.UUID, allowNull: false },
  title:         { type: DataTypes.STRING, allowNull: false },
  body:          { type: DataTypes.TEXT,   allowNull: false },
  type: {
    type: DataTypes.ENUM('appointment','order','prescription','system','reminder'),
    defaultValue: 'system',
  },
  referenceId:   { type: DataTypes.UUID,   allowNull: true },
  referenceType: { type: DataTypes.STRING, allowNull: true },
  isRead:        { type: DataTypes.BOOLEAN, defaultValue: false },
  readAt:        { type: DataTypes.DATE,    allowNull: true  },
}, { tableName: 'notifications', timestamps: true });

module.exports = Notification;
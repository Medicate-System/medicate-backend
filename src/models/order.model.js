const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  orderNumber:  { type: DataTypes.STRING, unique: true },
  patientId:    { type: DataTypes.UUID, allowNull: false },
  pharmacyId:   { type: DataTypes.UUID, allowNull: false },
  prescriptionId: { type: DataTypes.UUID, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled'),
    defaultValue: 'pending',
  },
  deliveryAddress:       { type: DataTypes.JSONB,         allowNull: false },
  subtotal:              { type: DataTypes.DECIMAL(10,2), allowNull: false },
  deliveryFee:           { type: DataTypes.DECIMAL(10,2), defaultValue: 0  },
  total:                 { type: DataTypes.DECIMAL(10,2), allowNull: false },
  paymentMethod:         { type: DataTypes.ENUM('cash','mobile_money','card'), defaultValue: 'cash' },
  isPaid:                { type: DataTypes.BOOLEAN, defaultValue: false },
  deliveryNotes:         { type: DataTypes.TEXT,    allowNull: true  },
  estimatedDeliveryTime: { type: DataTypes.DATE,    allowNull: true  },
  deliveredAt:           { type: DataTypes.DATE,    allowNull: true  },
  cancellationReason:    { type: DataTypes.STRING,  allowNull: true  },
}, {
  tableName: 'orders',
  timestamps: true,
  hooks: {
    beforeCreate: async (order) => {
      const count = await Order.count();
      order.orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
    },
  },
});

module.exports = Order;
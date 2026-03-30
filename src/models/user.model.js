const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  firstName: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true, len: [2, 50] } },
  lastName:  { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true, len: [2, 50] } },
  email:     { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  phone:     { type: DataTypes.STRING, allowNull: true, unique: true },
  password:  { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM('patient', 'doctor', 'pharmacist', 'admin'),
    allowNull: false, defaultValue: 'patient',
  },
  isVerified:            { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive:              { type: DataTypes.BOOLEAN, defaultValue: true  },
  fcmToken:              { type: DataTypes.STRING,  allowNull: true },
  refreshToken:          { type: DataTypes.TEXT,    allowNull: true },
  passwordResetToken:    { type: DataTypes.STRING,  allowNull: true },
  passwordResetExpires:  { type: DataTypes.DATE,    allowNull: true },
  lastLoginAt:           { type: DataTypes.DATE,    allowNull: true },
  avatar:                { type: DataTypes.STRING,  allowNull: true },
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) user.password = await bcrypt.hash(user.password, 12);
    },
  },
});

User.prototype.comparePassword = async function (candidate) {
  return require('bcryptjs').compare(candidate, this.password);
};

User.prototype.toSafeObject = function () {
  const { password, refreshToken, passwordResetToken, ...safe } = this.toJSON();
  return safe;
};

module.exports = User;
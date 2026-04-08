const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../utils/logger');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'healthcare_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432, // changed default to 5432
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions:
      process.env.NODE_ENV === 'production'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  }
);

const connectDB = async () => {
  const maxAttempts = parseInt(process.env.DB_CONNECT_RETRIES, 10) || 5;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await sequelize.authenticate();
      logger.info('✅ PostgreSQL connected successfully');

      if (process.env.NODE_ENV !== 'production') {
        await sequelize.sync({ alter: true });
        logger.info('✅ Database models synchronized');
      }
      return;
    } catch (error) {
      logger.error(`❌ Database connection attempt ${attempt} failed: ${error.message}`);
      if (attempt === maxAttempts) {
        logger.error(`❌ Could not connect to DB after ${maxAttempts} attempts. Continuing without exiting.`);
        return;
      }
      await wait(2000 * attempt);
    }
  }
};

module.exports = { sequelize, connectDB };
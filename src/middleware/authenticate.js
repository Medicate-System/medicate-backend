const jwt = require('jsonwebtoken');
const { cacheGet } = require('../config/redis');
const { AppError } = require('../utils/AppError');

const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token missing', 401);
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted (logout)
    const isBlacklisted = await cacheGet(`blacklist:${token}`);
    if (isBlacklisted) throw new AppError('Token has been invalidated', 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    next(error);
  }
};

module.exports = authenticate;
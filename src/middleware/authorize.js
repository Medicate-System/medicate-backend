const { AppError } = require('../utils/AppError');

// Usage: authorize('admin') or authorize('doctor', 'admin')
const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Access denied. Required role: ${roles.join(' or ')}`, 403)
      );
    }
    next();
  };
};

module.exports = authorize;
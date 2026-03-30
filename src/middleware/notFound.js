const { AppError } = require('../utils/AppError');

const notFound = (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

module.exports = notFound;
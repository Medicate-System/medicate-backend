const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const paginated = (res, data, meta, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta, // { total, page, limit, totalPages }
  });
};

const created = (res, data, message = 'Resource created') => {
  return success(res, data, message, 201);
};

module.exports = { success, created, paginated };
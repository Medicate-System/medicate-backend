const logger = require('../utils/logger');

const initSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    // ─── Join personal room (by userId) ───────────────
    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} joined their room`);
    });

    // ─── Join appointment room ─────────────────────────
    socket.on('join:appointment', (appointmentId) => {
      socket.join(`appointment:${appointmentId}`);
    });

    // ─── Doctor availability status ────────────────────
    socket.on('doctor:status', ({ doctorId, status }) => {
      io.emit(`doctor:${doctorId}:status`, { status });
    });

    // ─── Prescription order status update ─────────────
    socket.on('order:update', ({ orderId, status, patientId }) => {
      io.to(`user:${patientId}`).emit('order:status', { orderId, status });
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSocket;
require('dotenv').config();
require('express-async-errors');
require('./models'); 

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initFirebase } = require('./config/firebase');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const initSocket = require('./config/socket');
const logger = require('./utils/logger');

// ─── Route Imports ────────────────────────────────────────
const authRoutes = require('./modules/auth/auth.routes');
const patientRoutes = require('./modules/patients/patients.routes');
const doctorRoutes = require('./modules/doctors/doctors.routes');
const pharmacyRoutes = require('./modules/pharmacies/pharmacies.routes');
const prescriptionRoutes = require('./modules/prescriptions/prescriptions.routes');
const appointmentRoutes = require('./modules/appointments/appointments.routes');
const medicationRoutes = require('./modules/medications/medications.routes');
const notificationRoutes = require('./modules/notifications/notifications.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

// ─── Connect Services ─────────────────────────────────────
connectDB();
connectRedis();
initFirebase();
initSocket(io);

// ─── Global Middleware ────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// ─── Attach Socket to Requests ────────────────────────────
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ─── API Routes ───────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/patients`, patientRoutes);
app.use(`${API}/doctors`, doctorRoutes);
app.use(`${API}/pharmacies`, pharmacyRoutes);
app.use(`${API}/prescriptions`, prescriptionRoutes);
app.use(`${API}/appointments`, appointmentRoutes);
app.use(`${API}/medications`, medicationRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/admin`, adminRoutes);

// ─── API Docs ─────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: process.env.APP_NAME,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Error Handling ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────
const start = async () => {
  await connectDB();
  await connectRedis();
  initFirebase();
  initSocket(io);

  // ─── Start Server ─────────────────────────────────────────
  const PORT = process.env.PORT || 8000;
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    logger.info(`📚 API Docs available at http://localhost:${PORT}/api-docs`);
  });
};

start().catch((err) => {
  logger.error('Startup failure:', err);
  process.exit(1);
});

module.exports = { app, io };
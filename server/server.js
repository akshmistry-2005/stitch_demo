const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const { initSocket } = require('./config/socket');
const authMiddleware = require('./middleware/auth');
const tenantMiddleware = require('./middleware/tenant');

// Import routes
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const membersRoutes = require('./routes/members.routes');
const staffRoutes = require('./routes/staff.routes');
const trainersRoutes = require('./routes/trainers.routes');
const workoutsRoutes = require('./routes/workouts.routes');
const dietRoutes = require('./routes/diet.routes');
const eventsRoutes = require('./routes/events.routes');
const songsRoutes = require('./routes/songs.routes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public routes (no auth needed)
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes (auth + tenant middleware)
app.use('/api/dashboard', authMiddleware, tenantMiddleware, dashboardRoutes);
app.use('/api/members', authMiddleware, tenantMiddleware, membersRoutes);
app.use('/api/staff', authMiddleware, tenantMiddleware, staffRoutes);
app.use('/api/trainers', authMiddleware, tenantMiddleware, trainersRoutes);
app.use('/api/workouts', authMiddleware, tenantMiddleware, workoutsRoutes);
app.use('/api/diet', authMiddleware, tenantMiddleware, dietRoutes);
app.use('/api/events', authMiddleware, tenantMiddleware, eventsRoutes);
app.use('/api/songs', authMiddleware, tenantMiddleware, songsRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🏋️  GymFlow SaaS API Server           ║
  ║   Running on port ${PORT}                  ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}           ║
  ║   Socket.io: Enabled                     ║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = { app, server };

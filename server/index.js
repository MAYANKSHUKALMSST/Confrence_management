import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Import DB and Sync
import db from './db.js';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import notificationRoutes from './routes/notifications.js';
import profileRoutes from './routes/profiles.js';
import emailSettingsRoutes from './routes/email-settings.js';
import roomRoutes from './routes/rooms.js';
import analyticsRoutes from './routes/analytics.js';
import userRoutes from './routes/users.js';
import syncRoutes, { startSyncTimer, setupInstantSync } from './routes/sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust in production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Attach io to app for use in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected');
  });
});

// ── Middleware ──────────────────────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: null, // Keep disabled since we don't have SSL yet
    },
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: { action: 'deny' }
}));
app.disable('x-powered-by');
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// ── Rate Limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// ── Health Check ───────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    health_status: 'ok',
    role: process.env.SERVER_ROLE || 'primary',
    sys_time: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/email-settings', emailSettingsRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sync', syncRoutes);

// ── Serve frontend in production ───────────────────────────────────────────

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Start server ───────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`🚀 RoomBook API server running on http://localhost:${PORT}`);
  console.log(`📅 Build Timestamp: 2026-04-14 05:40 (FINAL RECOVERY)`);
  console.log(`🏷️ Server Role: ${process.env.SERVER_ROLE || 'primary'}`);
  
  // Start DB sync timer and instant sync hook
  startSyncTimer();
  setupInstantSync(db);
});

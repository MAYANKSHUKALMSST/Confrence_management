import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import DB (this initializes the database and seeds admin)
import './db.js';

// Import routes
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import notificationRoutes from './routes/notifications.js';
import profileRoutes from './routes/profiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ── API Routes ─────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profiles', profileRoutes);

// ── Serve frontend in production ───────────────────────────────────────────

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Start server ───────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 RoomBook API server running on http://localhost:${PORT}`);
});

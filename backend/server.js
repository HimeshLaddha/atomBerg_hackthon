import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './src/routes/userRoutes.js';
import goalRoutes from './src/routes/goalRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production set ALLOWED_ORIGINS=https://your-app.vercel.app in Render env vars.
// Multiple origins can be comma-separated: https://app.vercel.app,https://custom.com
// Falls back to open CORS in development (no env var set).
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser tools (Postman, server-to-server) and local dev
    if (!origin) return callback(null, true);
    if (!allowedOrigins) return callback(null, true); // open in dev
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Fail fast — Render will restart the service
  });

// Middlewares
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/admin', adminRoutes);

// Health check (Render uses this to verify the service is up)
app.get('/', (req, res) => {
  res.json({ message: 'GoalSync API is running', version: '2026-H1', env: process.env.NODE_ENV });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  console.error(`[ERROR] ${req.method} ${req.path} →`, message);
  res.status(status).json({ message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


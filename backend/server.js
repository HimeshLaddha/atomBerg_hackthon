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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goal-tracking-portal')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'GoalSync API is running', version: '2026-H1' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// Must be defined AFTER all routes. Catches any error thrown with next(err)
// or any unhandled promise rejection that Express intercepts, and always
// returns a structured JSON body so the frontend never gets an HTML error page.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  console.error(`[ERROR] ${req.method} ${req.path} →`, message, err.stack ?? '');
  res.status(status).json({ message, ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }) });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


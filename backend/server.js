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
app.use('/api/admin', adminRoutes);   // Governance: broadcast-kpi, audit-logs, completion-summary

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'GoalSync API is running', version: '2026-H1' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

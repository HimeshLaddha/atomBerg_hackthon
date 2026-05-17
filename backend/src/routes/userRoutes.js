import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get all users (useful for seeding the mock contexts on frontend)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).populate('managerId', 'name email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

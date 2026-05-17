import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goal-tracking-portal');
    console.log('Connected to MongoDB for seeding...');

    // Wipe existing users
    await User.deleteMany({});
    console.log('Cleared existing users.');

    // Create Admin/HR
    const admin = await User.create({
      userId: 'EMP-001',
      name: 'Alice Admin',
      email: 'alice.admin@company.com',
      role: 'Admin',
      department: 'Human Resources'
    });

    // Create L1 Manager (Reports to Admin conceptually or no one)
    const manager = await User.create({
      userId: 'EMP-002',
      name: 'Bob Manager',
      email: 'bob.manager@company.com',
      role: 'Manager',
      managerId: admin._id, // Just to link hierarchy
      department: 'Engineering'
    });

    // Create Employee (Reports to L1 Manager)
    const employee = await User.create({
      userId: 'EMP-003',
      name: 'Charlie Employee',
      email: 'charlie.employee@company.com',
      role: 'Employee',
      managerId: manager._id,
      department: 'Engineering'
    });

    console.log('Successfully seeded organic organizational hierarchy:');
    console.log(`- Admin: ${admin.name} (${admin._id})`);
    console.log(`- Manager: ${manager.name} (${manager._id})`);
    console.log(`- Employee: ${employee.name} (${employee._id})`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import GoalSheet from '../models/GoalSheet.js';
import AuditLog from '../models/AuditLog.js';

dotenv.config();

const EMPTY_QUARTERS = () => ({
  Q1: { actualAchievement: '', status: 'Not Started', managerComment: '' },
  Q2: { actualAchievement: '', status: 'Not Started', managerComment: '' },
  Q3: { actualAchievement: '', status: 'Not Started', managerComment: '' },
  Q4: { actualAchievement: '', status: 'Not Started', managerComment: '' }
});

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goal-tracking-portal');
    console.log('✅ Connected to MongoDB...');

    // ── Wipe all collections cleanly ──────────────────────────────────────────
    await AuditLog.deleteMany({});
    await GoalSheet.deleteMany({});
    await User.deleteMany({});
    console.log('🗑  Cleared: AuditLog, GoalSheet, User');

    // ── Create Users ──────────────────────────────────────────────────────────
    const admin = await User.create({
      userId: 'EMP-001',
      name: 'Alice Admin',
      email: 'alice@company.com',
      role: 'Admin',
      department: 'Human Resources'
    });

    const manager = await User.create({
      userId: 'EMP-002',
      name: 'Bob Manager',
      email: 'bob@company.com',
      role: 'Manager',
      managerId: admin._id,
      department: 'Engineering'
    });

    const employee = await User.create({
      userId: 'EMP-003',
      name: 'Charlie Employee',
      email: 'charlie@company.com',
      role: 'Employee',
      managerId: manager._id,
      department: 'Engineering'
    });

    // Second employee — for richer manager dashboard testing
    const employee2 = await User.create({
      userId: 'EMP-004',
      name: 'Diana Employee',
      email: 'diana@company.com',
      role: 'Employee',
      managerId: manager._id,
      department: 'Engineering'
    });

    console.log('\n👥 Users created:');
    console.log(`   Admin   : ${admin.name}     (${admin.userId})`);
    console.log(`   Manager : ${manager.name}   (${manager.userId})`);
    console.log(`   Employee: ${employee.name}  (${employee.userId})`);
    console.log(`   Employee: ${employee2.name}   (${employee2.userId})`);

    // ── Create a clean Draft GoalSheet for Charlie ────────────────────────────
    // (Tests the "sheet exists → show form with existing data" flow)
    const charlieSheet = await GoalSheet.create({
      employeeId: employee._id,
      cycle: '2026-H1',
      status: 'Draft',
      isLocked: false,
      goals: [
        {
          goalId: 'G-001',
          thrustArea: 'Revenue Growth',
          title: 'Increase Monthly Sales',
          description: 'Achieve monthly sales target of 5000 units.',
          uomType: 'Numeric_Min',
          target: '5000',
          weightage: 50,
          isShared: false,
          quarterlyAchievements: EMPTY_QUARTERS()
        },
        {
          goalId: 'G-002',
          thrustArea: 'Quality',
          title: 'Reduce Bug Escape Rate',
          description: 'Keep production bugs below 10 per release.',
          uomType: 'Numeric_Max',
          target: '10',
          weightage: 50,
          isShared: false,
          quarterlyAchievements: EMPTY_QUARTERS()
        }
      ]
    });

    console.log(`\n📋 GoalSheet created for Charlie:`);
    console.log(`   Status : ${charlieSheet.status}`);
    console.log(`   Goals  : ${charlieSheet.goals.length}`);
    console.log(`   ID     : ${charlieSheet._id}`);

    console.log('\n✅ Seed complete! Ready to test the full flow:\n');
    console.log('   1. Employee (EMP-003) → sees Draft form with 2 pre-filled goals');
    console.log('   2. Submit for Approval → status → Pending_Approval');
    console.log('   3. Manager (EMP-002) → sees pending sheet in Approvals Queue');
    console.log('   4. Manager approves → isLocked: true, status: Approved');
    console.log('   5. Employee → sees Q1–Q4 tracking grid');
    console.log('   6. Save Progress → quarterly data saved correctly');
    console.log('   7. Manager → Check-ins tab → add comment');
    console.log('   8. Admin (EMP-001) → Governance Panel → Export CSV\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedData();

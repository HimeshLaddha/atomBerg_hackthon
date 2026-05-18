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

/**
 * Seed data aligned with the Login.jsx persona system:
 *
 *   Login credential │ Backend userId │ Name         │ Role
 *   john.doe         │ EMP-003        │ John Doe     │ Employee
 *   jane.smith       │ EMP-002        │ Jane Smith   │ Manager
 *   alex.rivera      │ EMP-001        │ Alex Rivera  │ Admin
 *
 * A second employee "Diana Employee" (EMP-004) exists to populate the
 * manager's subordinate table with two distinct rows.
 */
const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goal-tracking-portal');
    console.log('✅ Connected to MongoDB...');

    // ── Wipe all collections cleanly ──────────────────────────────────────────
    await AuditLog.deleteMany({});
    await GoalSheet.deleteMany({});
    await User.deleteMany({});
    console.log('🗑  Cleared: AuditLog, GoalSheet, User');

    // ── Create Users matching Login.jsx persona cards ─────────────────────────
    const admin = await User.create({
      userId: 'EMP-001',
      name: 'Alex Rivera',          // matches Login persona "alex.rivera"
      email: 'alex@company.com',
      role: 'Admin',
      department: 'Human Resources'
    });

    const manager = await User.create({
      userId: 'EMP-002',
      name: 'Jane Smith',           // matches Login persona "jane.smith"
      email: 'jane@company.com',
      role: 'Manager',
      managerId: admin._id,
      department: 'Engineering'
    });

    const employee = await User.create({
      userId: 'EMP-003',
      name: 'John Doe',             // matches Login persona "john.doe"
      email: 'john@company.com',
      role: 'Employee',
      managerId: manager._id,
      department: 'Engineering'
    });

    // Second employee — for richer manager dashboard testing (two subordinate rows)
    const employee2 = await User.create({
      userId: 'EMP-004',
      name: 'Diana Employee',
      email: 'diana@company.com',
      role: 'Employee',
      managerId: manager._id,
      department: 'Engineering'
    });

    console.log('\n👥 Users created (aligned with Login.jsx personas):');
    console.log(`   Admin   : ${admin.name}      (${admin.userId})  → Login: alex.rivera / adm@2026`);
    console.log(`   Manager : ${manager.name}     (${manager.userId})  → Login: jane.smith  / mgr@2026`);
    console.log(`   Employee: ${employee.name}       (${employee.userId})  → Login: john.doe    / emp@2026`);
    console.log(`   Employee: ${employee2.name} (${employee2.userId})  → (no login card — appears in manager table)`);

    // ── Create a Draft GoalSheet for John Doe ─────────────────────────────────
    // Tests the "sheet exists → show form with existing data" flow
    const johnSheet = await GoalSheet.create({
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

    console.log(`\n📋 GoalSheet created for John Doe:`);
    console.log(`   Status : ${johnSheet.status}`);
    console.log(`   Goals  : ${johnSheet.goals.length}`);
    console.log(`   ID     : ${johnSheet._id}`);

    console.log('\n✅ Seed complete! Test journey:\n');
    console.log('   1. Login as john.doe (emp@2026) → Employee Dashboard');
    console.log('      → Sees Draft form with 2 pre-filled goals');
    console.log('   2. Submit for Approval → status → Pending_Approval');
    console.log('   3. Login as jane.smith (mgr@2026) → Manager Dashboard');
    console.log('      → Sees pending sheet in Phase 1 Approvals Queue');
    console.log('      → Modify inline, then Approve & Lock');
    console.log('   4. isLocked: true, status: Approved → AuditLog written');
    console.log('   5. Login back as john.doe → Q1–Q4 Tracking Grid unlocked');
    console.log('      → Test Numeric_Min: target=5000, actual=6000 → rawScore 120%, bar 100%');
    console.log('      → Test Numeric_Max: target=10, actual=20 → rawScore 50%, bar 50%');
    console.log('      → Test Zero-based: actual=0 → 100%, actual=1 → 0%');
    console.log('   6. Login as alex.rivera (adm@2026) → Admin Dashboard');
    console.log('      → Broadcast KPI to EMP-003 via /api/admin/broadcast-kpi');
    console.log('      → Check Completion Tracker, Audit Trail, CSV Export\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedData();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import GoalSheet from '../models/GoalSheet.js';
import AuditLog from '../models/AuditLog.js';

dotenv.config();

// ─── Quarter helpers ───────────────────────────────────────────────────────────
const q = (actual, status, comment = '') => ({
  actualAchievement: actual,
  status,
  managerComment: comment,
});

const EMPTY = () => q('', 'Not Started', '');

/**
 * Seed data — full Q1–Q4 populated for all employees.
 *
 *   Login credential │ Backend userId │ Name          │ Role
 *   john.doe         │ EMP-003        │ John Doe      │ Employee (Approved + Locked)
 *   jane.smith       │ EMP-002        │ Jane Smith    │ Manager
 *   alex.rivera      │ EMP-001        │ Alex Rivera   │ Admin
 *   (no login card)  │ EMP-004        │ Diana Employee│ Employee (Pending_Approval)
 */
const seedData = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/goal-tracking-portal'
    );
    console.log('✅ Connected to MongoDB...');

    // ── Wipe all collections cleanly ─────────────────────────────────────────
    await AuditLog.deleteMany({});
    await GoalSheet.deleteMany({});
    await User.deleteMany({});
    console.log('🗑  Cleared: AuditLog, GoalSheet, User');

    // ── Create Users ──────────────────────────────────────────────────────────
    const admin = await User.create({
      userId: 'EMP-001',
      name: 'Alex Rivera',
      email: 'alex@company.com',
      role: 'Admin',
      department: 'Human Resources',
    });

    const manager = await User.create({
      userId: 'EMP-002',
      name: 'Jane Smith',
      email: 'jane@company.com',
      role: 'Manager',
      managerId: admin._id,
      department: 'Engineering',
    });

    const john = await User.create({
      userId: 'EMP-003',
      name: 'John Doe',
      email: 'john@company.com',
      role: 'Employee',
      managerId: manager._id,
      department: 'Engineering',
    });

    const diana = await User.create({
      userId: 'EMP-004',
      name: 'Diana Employee',
      email: 'diana@company.com',
      role: 'Employee',
      managerId: manager._id,
      department: 'Engineering',
    });

    console.log('\n👥 Users created:');
    console.log(`   Admin   : ${admin.name}   (${admin.userId})`);
    console.log(`   Manager : ${manager.name}    (${manager.userId})`);
    console.log(`   Employee: ${john.name}       (${john.userId})`);
    console.log(`   Employee: ${diana.name} (${diana.userId})`);

    // ─────────────────────────────────────────────────────────────────────────
    // JOHN DOE — Approved & Locked sheet with full Q1–Q4 data
    // Covers all 4 UoM types so every progress engine branch can be demoed.
    // ─────────────────────────────────────────────────────────────────────────
    const johnSheet = await GoalSheet.create({
      employeeId: john._id,
      cycle: '2026-H1',
      status: 'Approved',
      isLocked: true,
      goals: [
        // ── Goal 1: Numeric_Min (Higher is Better) — overachiever in Q1 ──────
        {
          goalId: 'G-JD-001',
          thrustArea: 'Revenue Growth',
          title: 'Increase Monthly Sales Units',
          description: 'Achieve monthly sales target of 5,000 units per quarter.',
          uomType: 'Numeric_Min',
          target: '5000',
          weightage: 25,
          isShared: false,
          quarterlyAchievements: {
            Q1: q('6000', 'Completed',  'Excellent — 120% achievement. Keep momentum.'),
            Q2: q('5200', 'Completed',  'On target. Slight dip vs Q1 but still above goal.'),
            Q3: q('4800', 'On Track',   'Just below target — address distribution gap in Oct.'),
            Q4: q('5500', 'Completed',  'Strong close. Full year well above target.'),
          },
        },

        // ── Goal 2: Numeric_Max (Lower is Better) — quality metric ───────────
        {
          goalId: 'G-JD-002',
          thrustArea: 'Quality',
          title: 'Reduce Bug Escape Rate',
          description: 'Keep production bugs below 10 per release cycle.',
          uomType: 'Numeric_Max',
          target: '10',
          weightage: 20,
          isShared: false,
          quarterlyAchievements: {
            Q1: q('7',  'Completed', 'Well within target. Test coverage improved significantly.'),
            Q2: q('10', 'Completed', 'Exactly at target. Needs further regression hardening.'),
            Q3: q('13', 'On Track',  'Slightly over — regression suite gaps identified. Fixing.'),
            Q4: q('8',  'Completed', 'Strong recovery in Q4. Below target. Good discipline.'),
          },
        },

        // ── Goal 3: Percentage_Min (Higher is Better) — customer satisfaction ─
        {
          goalId: 'G-JD-003',
          thrustArea: 'Customer Success',
          title: 'Customer Satisfaction Score (CSAT)',
          description: 'Maintain CSAT above 85% across all support interactions.',
          uomType: 'Percentage_Min',
          target: '85',
          weightage: 20,
          isShared: true,    // HR-injected shared KPI
          quarterlyAchievements: {
            Q1: q('88', 'Completed', 'Above target. Proactive communication cited as key driver.'),
            Q2: q('82', 'On Track',  'Slight dip. Review SLA breach tickets — coaching scheduled.'),
            Q3: q('90', 'Completed', 'Best quarter. New response template effective.'),
            Q4: q('87', 'Completed', 'Consistent above threshold. Full year avg: 86.75%.'),
          },
        },

        // ── Goal 4: Zero-based (Zero = Perfect Success) ───────────────────────
        {
          goalId: 'G-JD-004',
          thrustArea: 'Compliance',
          title: 'Critical Security Incidents',
          description: 'Zero critical security incidents in production environment.',
          uomType: 'Zero-based',
          target: '0',
          weightage: 20,
          isShared: true,    // HR-injected shared KPI
          quarterlyAchievements: {
            Q1: q('0', 'Completed', 'Perfect. No incidents. Security patches applied on schedule.'),
            Q2: q('0', 'Completed', 'Clean quarter. Pen test passed with no critical findings.'),
            Q3: q('1', 'On Track',  '1 incident logged (P2). Resolved in 4h. RCA documented.'),
            Q4: q('0', 'Completed', 'Recovered to zero. All Q3 RCA actions closed.'),
          },
        },

        // ── Goal 5: Timeline (Date-based) ─────────────────────────────────────
        {
          goalId: 'G-JD-005',
          thrustArea: 'Product Delivery',
          title: 'Platform Migration Completion',
          description: 'Complete cloud migration by the planned deadline of 2026-06-30.',
          uomType: 'Timeline',
          target: '2026-06-30',
          weightage: 15,
          isShared: false,
          quarterlyAchievements: {
            Q1: q('2026-03-15', 'Completed', 'Phase 1 (infra setup) complete 2 weeks early.'),
            Q2: q('2026-06-28', 'Completed', 'Migration complete — 2 days ahead of deadline. '),
            Q3: q('2026-09-10', 'Completed', 'Post-migration optimisation phase delivered on time.'),
            Q4: q('2026-12-01', 'Completed', 'All legacy systems decommissioned. Project closed.'),
          },
        },
      ],
    });

    console.log(`\n📋 John Doe — Approved & Locked sheet:`);
    console.log(`   Goals  : ${johnSheet.goals.length} (covers all 4 UoM types)`);
    console.log(`   Status : ${johnSheet.status} | isLocked: ${johnSheet.isLocked}`);
    console.log(`   ID     : ${johnSheet._id}`);

    // ─────────────────────────────────────────────────────────────────────────
    // DIANA EMPLOYEE — Pending_Approval (shows in manager review queue)
    // 3 goals, weightage sums to 100%, none below 10%
    // ─────────────────────────────────────────────────────────────────────────
    const dianaSheet = await GoalSheet.create({
      employeeId: diana._id,
      cycle: '2026-H1',
      status: 'Pending_Approval',
      isLocked: false,
      goals: [
        {
          goalId: 'G-DE-001',
          thrustArea: 'Revenue Growth',
          title: 'Onboard New Enterprise Clients',
          description: 'Onboard at least 5 new enterprise accounts per quarter.',
          uomType: 'Numeric_Min',
          target: '5',
          weightage: 40,
          isShared: false,
          quarterlyAchievements: {
            Q1: EMPTY(), Q2: EMPTY(), Q3: EMPTY(), Q4: EMPTY(),
          },
        },
        {
          goalId: 'G-DE-002',
          thrustArea: 'Quality',
          title: 'Documentation Coverage',
          description: 'Ensure 100% API documentation coverage for all new endpoints.',
          uomType: 'Percentage_Min',
          target: '100',
          weightage: 35,
          isShared: false,
          quarterlyAchievements: {
            Q1: EMPTY(), Q2: EMPTY(), Q3: EMPTY(), Q4: EMPTY(),
          },
        },
        {
          goalId: 'G-DE-003',
          thrustArea: 'Compliance',
          title: 'Critical Security Incidents',
          description: 'Zero critical security incidents.',
          uomType: 'Zero-based',
          target: '0',
          weightage: 25,
          isShared: true,
          quarterlyAchievements: {
            Q1: EMPTY(), Q2: EMPTY(), Q3: EMPTY(), Q4: EMPTY(),
          },
        },
      ],
    });

    console.log(`\n📋 Diana Employee — Pending Approval sheet:`);
    console.log(`   Goals  : ${dianaSheet.goals.length}`);
    console.log(`   Status : ${dianaSheet.status}`);
    console.log(`   ID     : ${dianaSheet._id}`);

    // ─────────────────────────────────────────────────────────────────────────
    // AUDIT LOG — seed post-lock mutations so Audit Trail tab has entries
    // ─────────────────────────────────────────────────────────────────────────
    await AuditLog.create([
      {
        goalSheetId: johnSheet._id,
        changedBy:   manager._id,
        timestamp:   new Date('2026-01-15T10:30:00Z'),
        changes: [{ field: 'status', oldValue: 'Pending_Approval', newValue: 'Approved' }],
      },
      {
        goalSheetId: johnSheet._id,
        changedBy:   john._id,
        timestamp:   new Date('2026-04-02T09:15:00Z'),
        changes: [
          { field: 'goals["Increase Monthly Sales Units"].Q1.actualAchievement', oldValue: '', newValue: '6000' },
          { field: 'goals["Increase Monthly Sales Units"].Q1.status',            oldValue: 'Not Started', newValue: 'Completed' },
        ],
      },
      {
        goalSheetId: johnSheet._id,
        changedBy:   manager._id,
        timestamp:   new Date('2026-04-05T14:00:00Z'),
        changes: [
          { field: 'goals["Increase Monthly Sales Units"].Q1.managerComment', oldValue: '', newValue: 'Excellent — 120% achievement. Keep momentum.' },
        ],
      },
      {
        goalSheetId: johnSheet._id,
        changedBy:   john._id,
        timestamp:   new Date('2026-07-03T11:00:00Z'),
        changes: [
          { field: 'goals["Reduce Bug Escape Rate"].Q2.actualAchievement', oldValue: '', newValue: '10' },
          { field: 'goals["Reduce Bug Escape Rate"].Q2.status',            oldValue: 'Not Started', newValue: 'Completed' },
        ],
      },
      {
        goalSheetId: johnSheet._id,
        changedBy:   admin._id,
        timestamp:   new Date('2026-02-01T08:00:00Z'),
        changes: [
          { field: 'Shared KPI injected: Customer Satisfaction Score (CSAT)', oldValue: '', newValue: 'target=85, uomType=Percentage_Min' },
        ],
      },
    ]);

    console.log('\n📝 AuditLog — 5 entries seeded (approval + quarterly updates + KPI injection)');

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n✅ Seed complete! Full demo journey:\n');
    console.log('   1. Login as alex.rivera (adm@2026) → Admin Dashboard');
    console.log('      → Completion Tracker: 1 approved sheet (John Doe)');
    console.log('      → CSV Export: 5 goals × 4 quarters = 20 rows');
    console.log('      → Audit Trail: 5 log entries visible');
    console.log('      → Inject Shared KPI to EMP-003 or EMP-004\n');
    console.log('   2. Login as jane.smith (mgr@2026) → Manager Dashboard');
    console.log('      → Phase 1 Tab: Diana\'s sheet in Pending Approval queue');
    console.log('      → Phase 2 Tab: John\'s sheet — all 4 Qs with manager comments\n');
    console.log('   3. Login as john.doe (emp@2026) → Employee Dashboard');
    console.log('      → Goal form is LOCKED (isLocked: true)');
    console.log('      → Tracking Grid active: Q1–Q4 all pre-filled');
    console.log('      → UoM demo: G1=Numeric_Min(120%★), G2=Numeric_Max(50%),');
    console.log('                  G3=Percentage_Min(88%), G4=Zero-based(100%/0%),');
    console.log('                  G5=Timeline(2026-06-28 vs 2026-06-30 deadline)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedData();

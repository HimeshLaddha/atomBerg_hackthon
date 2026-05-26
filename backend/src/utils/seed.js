import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import GoalSheet from '../models/GoalSheet.js';
import AuditLog from '../models/AuditLog.js';

dotenv.config();

// ── Quarter helpers ────────────────────────────────────────────────────────────
const q  = (actual, status, comment = '') => ({ actualAchievement: actual, status, managerComment: comment });
const E  = () => q('', 'Not Started', '');
const OT = (actual, comment = '') => q(actual, 'On Track', comment);
const C  = (actual, comment = '') => q(actual, 'Completed', comment);

// ─────────────────────────────────────────────────────────────────────────────
const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goal-tracking-portal');
    console.log('✅ Connected to MongoDB');

    await AuditLog.deleteMany({});
    await GoalSheet.deleteMany({});
    await User.deleteMany({});
    console.log('🗑  Cleared collections');

    // ── ADMINS ────────────────────────────────────────────────────────────────
    const alex = await User.create({ userId:'EMP-001', username:'alex.rivera', password:'adm@2026', name:'Alex Rivera',  email:'alex@company.com',  role:'Admin', department:'Human Resources' });
    const priya = await User.create({ userId:'EMP-011', username:'priya.kapoor', password:'adm@2026b', name:'Priya Kapoor', email:'priya@company.com', role:'Admin', department:'Human Resources' });
    const sam  = await User.create({ userId:'EMP-012', username:'sam.obrien', password:'adm@2026c', name:'Sam O\'Brien',  email:'sam@company.com',   role:'Admin', department:'Operations' });

    // ── MANAGERS ──────────────────────────────────────────────────────────────
    const jane  = await User.create({ userId:'EMP-002', username:'jane.smith', password:'mgr@2026', name:'Jane Smith',    email:'jane@company.com',    role:'Manager', managerId: alex._id,  department:'Engineering' });
    const bob   = await User.create({ userId:'EMP-005', username:'bob.martinez', password:'mgr@2026b', name:'Bob Martinez',  email:'bob@company.com',     role:'Manager', managerId: alex._id,  department:'Sales' });
    const nina  = await User.create({ userId:'EMP-006', username:'nina.patel', password:'mgr@2026c', name:'Nina Patel',    email:'nina@company.com',    role:'Manager', managerId: priya._id, department:'Marketing' });
    const raj   = await User.create({ userId:'EMP-007', username:'raj.mehta', password:'mgr@2026d', name:'Raj Mehta',     email:'raj@company.com',     role:'Manager', managerId: sam._id,   department:'Finance' });

    // ── EMPLOYEES ─────────────────────────────────────────────────────────────
    const john   = await User.create({ userId:'EMP-003', username:'john.doe', password:'emp@2026', name:'John Doe',       email:'john@company.com',    role:'Employee', managerId: jane._id, department:'Engineering' });
    const diana  = await User.create({ userId:'EMP-004', username:'diana.emp', password:'emp@2026b', name:'Diana Employee', email:'diana@company.com',   role:'Employee', managerId: jane._id, department:'Engineering' });
    const chen   = await User.create({ userId:'EMP-008', username:'alice.chen', password:'emp@2026c', name:'Alice Chen',     email:'alice@company.com',   role:'Employee', managerId: jane._id, department:'Engineering' });
    const david  = await User.create({ userId:'EMP-009', username:'david.lee', password:'emp@2026d', name:'David Lee',      email:'david@company.com',   role:'Employee', managerId: bob._id,  department:'Sales' });
    const sana   = await User.create({ userId:'EMP-010', username:'sana.mirza', password:'emp@2026e', name:'Sana Mirza',     email:'sana@company.com',    role:'Employee', managerId: bob._id,  department:'Sales' });
    const leo    = await User.create({ userId:'EMP-013', username:'leo.costa', password:'emp@2026f', name:'Leo Costa',      email:'leo@company.com',     role:'Employee', managerId: nina._id, department:'Marketing' });
    const meera  = await User.create({ userId:'EMP-014', username:'meera.joshi', password:'emp@2026g', name:'Meera Joshi',    email:'meera@company.com',   role:'Employee', managerId: nina._id, department:'Marketing' });
    const tom    = await User.create({ userId:'EMP-015', username:'tom.nguyen', password:'emp@2026h', name:'Tom Nguyen',     email:'tom@company.com',     role:'Employee', managerId: raj._id,  department:'Finance' });
    const fia    = await User.create({ userId:'EMP-016', username:'fia.andersen', password:'emp@2026i', name:'Fia Andersen',   email:'fia@company.com',     role:'Employee', managerId: raj._id,  department:'Finance' });
    const rohan  = await User.create({ userId:'EMP-017', username:'rohan.gupta', password:'emp@2026j', name:'Rohan Gupta',    email:'rohan@company.com',   role:'Employee', managerId: jane._id, department:'Engineering' });

    console.log('👥 17 users created (3 Admin, 4 Manager, 10 Employee)');

    // ═════════════════════════════════════════════════════════════════════════
    // GOAL SHEETS
    // ═════════════════════════════════════════════════════════════════════════

    // ── JOHN DOE — Approved & Locked, full Q1–Q4 (all UoM types) ─────────────
    const johnSheet = await GoalSheet.create({
      employeeId: john._id, cycle:'2026-H1', status:'Approved', isLocked: true,
      goals: [
        { goalId:'G-JD-001', thrustArea:'Revenue Growth', title:'Increase Monthly Sales Units',
          uomType:'Numeric_Min', target:'5000', weightage:25, isShared:false,
          quarterlyAchievements:{ Q1:C('6000','Excellent — 120%. Keep momentum.'), Q2:C('5200','On target.'), Q3:OT('4800','Slight dip — address distribution gap.'), Q4:C('5500','Strong close.') }},
        { goalId:'G-JD-002', thrustArea:'Quality', title:'Reduce Bug Escape Rate',
          uomType:'Numeric_Max', target:'10', weightage:20, isShared:false,
          quarterlyAchievements:{ Q1:C('7','Well within target.'), Q2:C('10','Exactly at target.'), Q3:OT('13','Slightly over — regression gaps identified.'), Q4:C('8','Strong recovery.') }},
        { goalId:'G-JD-003', thrustArea:'Customer Success', title:'Customer Satisfaction Score (CSAT)',
          uomType:'Percentage_Min', target:'85', weightage:20, isShared:true,
          quarterlyAchievements:{ Q1:C('88','Above target.'), Q2:OT('82','Slight dip — coaching scheduled.'), Q3:C('90','Best quarter.'), Q4:C('87','Full year avg 86.75%.') }},
        { goalId:'G-JD-004', thrustArea:'Compliance', title:'Critical Security Incidents',
          uomType:'Zero-based', target:'0', weightage:20, isShared:true,
          quarterlyAchievements:{ Q1:C('0','No incidents.'), Q2:C('0','Clean quarter.'), Q3:OT('1','1 P2 incident — RCA documented.'), Q4:C('0','Recovered to zero.') }},
        { goalId:'G-JD-005', thrustArea:'Product Delivery', title:'Platform Migration Completion',
          uomType:'Timeline', target:'2026-06-30', weightage:15, isShared:false,
          quarterlyAchievements:{ Q1:C('2026-03-15','Phase 1 complete 2 weeks early.'), Q2:C('2026-06-28','Migration complete — 2 days ahead.'), Q3:C('2026-09-10','Post-migration optimisation delivered.'), Q4:C('2026-12-01','Legacy systems decommissioned.') }},
      ],
    });

    // ── DIANA — Pending_Approval ───────────────────────────────────────────────
    const dianaSheet = await GoalSheet.create({
      employeeId: diana._id, cycle:'2026-H1', status:'Pending_Approval', isLocked:false,
      goals: [
        { goalId:'G-DE-001', thrustArea:'Revenue Growth', title:'Onboard New Enterprise Clients',
          uomType:'Numeric_Min', target:'5', weightage:40, isShared:false,
          quarterlyAchievements:{ Q1:E(), Q2:E(), Q3:E(), Q4:E() }},
        { goalId:'G-DE-002', thrustArea:'Quality', title:'API Documentation Coverage',
          uomType:'Percentage_Min', target:'100', weightage:35, isShared:false,
          quarterlyAchievements:{ Q1:E(), Q2:E(), Q3:E(), Q4:E() }},
        { goalId:'G-DE-003', thrustArea:'Compliance', title:'Critical Security Incidents',
          uomType:'Zero-based', target:'0', weightage:25, isShared:true,
          quarterlyAchievements:{ Q1:E(), Q2:E(), Q3:E(), Q4:E() }},
      ],
    });

    // ── ALICE CHEN — Approved & Locked, Engineering ────────────────────────────
    const chenSheet = await GoalSheet.create({
      employeeId: chen._id, cycle:'2026-H1', status:'Approved', isLocked:true,
      goals: [
        { goalId:'G-AC-001', thrustArea:'Product Delivery', title:'Ship 3 Core Features',
          uomType:'Numeric_Min', target:'3', weightage:35, isShared:false,
          quarterlyAchievements:{ Q1:C('3','All 3 shipped on time.'), Q2:C('4','Overdelivered — 133%.'), Q3:OT('2','1 deferred to Q4.'), Q4:C('3','Back on track.') }},
        { goalId:'G-AC-002', thrustArea:'Quality', title:'Code Review Turnaround ≤ 24h',
          uomType:'Numeric_Max', target:'24', weightage:30, isShared:false,
          quarterlyAchievements:{ Q1:C('18','Excellent turnaround.'), Q2:C('22','Within target.'), Q3:C('20','Good discipline.'), Q4:C('16','Best quarter.') }},
        { goalId:'G-AC-003', thrustArea:'Compliance', title:'Zero Critical Security Incidents',
          uomType:'Zero-based', target:'0', weightage:20, isShared:true,
          quarterlyAchievements:{ Q1:C('0','Clean.'), Q2:C('0','Clean.'), Q3:C('0','Clean.'), Q4:C('0','Clean.') }},
        { goalId:'G-AC-004', thrustArea:'Customer Success', title:'CSAT Score',
          uomType:'Percentage_Min', target:'85', weightage:15, isShared:true,
          quarterlyAchievements:{ Q1:C('87','Above target.'), Q2:C('89','Strong.'), Q3:OT('83','Just below — follow-up coaching.'), Q4:C('91','Best quarter.') }},
      ],
    });

    // ── DAVID LEE — Approved, Sales ───────────────────────────────────────────
    const davidSheet = await GoalSheet.create({
      employeeId: david._id, cycle:'2026-H1', status:'Approved', isLocked:true,
      goals: [
        { goalId:'G-DL-001', thrustArea:'Revenue Growth', title:'Quarterly Pipeline Value (₹L)',
          uomType:'Numeric_Min', target:'200', weightage:40, isShared:false,
          quarterlyAchievements:{ Q1:C('240','Excellent — 120%.'), Q2:C('210','On track.'), Q3:OT('180','Slightly below — market headwinds.'), Q4:C('255','Strong year-end push.') }},
        { goalId:'G-DL-002', thrustArea:'Customer Success', title:'Deal Win Rate %',
          uomType:'Percentage_Min', target:'35', weightage:35, isShared:false,
          quarterlyAchievements:{ Q1:C('42','Well above target.'), Q2:C('38','On track.'), Q3:OT('31','Below — coaching on objection handling.'), Q4:C('45','Best quarter ever.') }},
        { goalId:'G-DL-003', thrustArea:'Compliance', title:'CRM Data Hygiene — Stale Entries',
          uomType:'Numeric_Max', target:'10', weightage:25, isShared:false,
          quarterlyAchievements:{ Q1:C('4','Very clean.'), Q2:C('7','Good.'), Q3:OT('12','Slightly over — data cleanse sprint started.'), Q4:C('3','Best.') }},
      ],
    });

    // ── SANA MIRZA — Approved, Sales ──────────────────────────────────────────
    const sanaSheet = await GoalSheet.create({
      employeeId: sana._id, cycle:'2026-H1', status:'Approved', isLocked:true,
      goals: [
        { goalId:'G-SM-001', thrustArea:'Revenue Growth', title:'New Logo Acquisitions',
          uomType:'Numeric_Min', target:'8', weightage:45, isShared:false,
          quarterlyAchievements:{ Q1:C('9','Overachieved.'), Q2:C('8','On target.'), Q3:OT('6','2 deals slipped to Q4.'), Q4:C('10','Closed all slipped deals + 2 more.') }},
        { goalId:'G-SM-002', thrustArea:'Customer Success', title:'Net Promoter Score',
          uomType:'Percentage_Min', target:'60', weightage:30, isShared:false,
          quarterlyAchievements:{ Q1:C('68','Strong NPS.'), Q2:C('65','Maintained.'), Q3:C('70','Best quarter.'), Q4:C('72','Outstanding.') }},
        { goalId:'G-SM-003', thrustArea:'Compliance', title:'Contract Documentation Completeness',
          uomType:'Percentage_Min', target:'100', weightage:25, isShared:false,
          quarterlyAchievements:{ Q1:C('100','Perfect.'), Q2:C('100','Perfect.'), Q3:C('97','3 docs late — resolved.'), Q4:C('100','Perfect close.') }},
      ],
    });

    // ── LEO COSTA — Draft, Marketing ──────────────────────────────────────────
    const leoSheet = await GoalSheet.create({
      employeeId: leo._id, cycle:'2026-H1', status:'Draft', isLocked:false,
      goals: [
        { goalId:'G-LC-001', thrustArea:'Brand Building', title:'Social Media Impressions (M)',
          uomType:'Numeric_Min', target:'5', weightage:40, isShared:false,
          quarterlyAchievements:{ Q1:E(), Q2:E(), Q3:E(), Q4:E() }},
        { goalId:'G-LC-002', thrustArea:'Revenue Growth', title:'Marketing Qualified Leads',
          uomType:'Numeric_Min', target:'150', weightage:35, isShared:false,
          quarterlyAchievements:{ Q1:E(), Q2:E(), Q3:E(), Q4:E() }},
        { goalId:'G-LC-003', thrustArea:'Operational Excellence', title:'Campaign Launch On Time',
          uomType:'Timeline', target:'2026-03-31', weightage:25, isShared:false,
          quarterlyAchievements:{ Q1:E(), Q2:E(), Q3:E(), Q4:E() }},
      ],
    });

    // ── MEERA JOSHI — Approved, Marketing ────────────────────────────────────
    const meeraSheet = await GoalSheet.create({
      employeeId: meera._id, cycle:'2026-H1', status:'Approved', isLocked:true,
      goals: [
        { goalId:'G-MJ-001', thrustArea:'Brand Building', title:'Content Published per Quarter',
          uomType:'Numeric_Min', target:'20', weightage:35, isShared:false,
          quarterlyAchievements:{ Q1:C('24','Overachieved.'), Q2:C('22','On track.'), Q3:C('21','Good.'), Q4:C('28','Best quarter.') }},
        { goalId:'G-MJ-002', thrustArea:'Revenue Growth', title:'Email Campaign Open Rate %',
          uomType:'Percentage_Min', target:'25', weightage:35, isShared:false,
          quarterlyAchievements:{ Q1:C('31','Excellent.'), Q2:OT('23','Slightly below — A/B testing applied.'), Q3:C('28','Recovered.'), Q4:C('33','Best.') }},
        { goalId:'G-MJ-003', thrustArea:'Operational Excellence', title:'Ad Budget Overruns',
          uomType:'Zero-based', target:'0', weightage:30, isShared:false,
          quarterlyAchievements:{ Q1:C('0','Perfect.'), Q2:C('0','Perfect.'), Q3:C('0','Perfect.'), Q4:C('0','Perfect — full year zero overruns.') }},
      ],
    });

    // ── TOM NGUYEN — Approved, Finance ────────────────────────────────────────
    const tomSheet = await GoalSheet.create({
      employeeId: tom._id, cycle:'2026-H1', status:'Approved', isLocked:true,
      goals: [
        { goalId:'G-TN-001', thrustArea:'Operational Excellence', title:'Monthly Close Cycle (Days)',
          uomType:'Numeric_Max', target:'5', weightage:40, isShared:false,
          quarterlyAchievements:{ Q1:C('4','One day ahead.'), Q2:C('5','On target.'), Q3:OT('6','One day over — investigating bottleneck.'), Q4:C('4','Recovered.') }},
        { goalId:'G-TN-002', thrustArea:'Compliance', title:'Audit Findings — Critical',
          uomType:'Zero-based', target:'0', weightage:35, isShared:false,
          quarterlyAchievements:{ Q1:C('0','Clean audit.'), Q2:C('0','Clean audit.'), Q3:C('0','Clean.'), Q4:C('0','Full year clean.') }},
        { goalId:'G-TN-003', thrustArea:'Revenue Growth', title:'Cost Savings Identified (₹L)',
          uomType:'Numeric_Min', target:'50', weightage:25, isShared:false,
          quarterlyAchievements:{ Q1:C('62','Identified vendor negotiation savings.'), Q2:C('55','Process optimisation savings.'), Q3:OT('40','Slightly below — new savings initiatives in flight.'), Q4:C('70','Strong year-end delivery.') }},
      ],
    });

    // ── FIA ANDERSEN — Pending_Approval, Finance ──────────────────────────────
    const fiaSheet = await GoalSheet.create({
      employeeId: fia._id, cycle:'2026-H1', status:'Pending_Approval', isLocked:false,
      goals: [
        { goalId:'G-FA-001', thrustArea:'Compliance', title:'Regulatory Filing Timeliness',
          uomType:'Percentage_Min', target:'100', weightage:50, isShared:false,
          quarterlyAchievements:{ Q1:E(), Q2:E(), Q3:E(), Q4:E() }},
        { goalId:'G-FA-002', thrustArea:'Operational Excellence', title:'Expense Report Accuracy',
          uomType:'Percentage_Min', target:'98', weightage:30, isShared:false,
          quarterlyAchievements:{ Q1:E(), Q2:E(), Q3:E(), Q4:E() }},
        { goalId:'G-FA-003', thrustArea:'Revenue Growth', title:'Cost Variance ≤ Budget',
          uomType:'Percentage_Max', target:'5', weightage:20, isShared:false,
          quarterlyAchievements:{ Q1:E(), Q2:E(), Q3:E(), Q4:E() }},
      ],
    });

    // ── ROHAN GUPTA — Approved, Engineering ───────────────────────────────────
    const rohanSheet = await GoalSheet.create({
      employeeId: rohan._id, cycle:'2026-H1', status:'Approved', isLocked:true,
      goals: [
        { goalId:'G-RG-001', thrustArea:'People Development', title:'Attrition Rate %',
          uomType:'Percentage_Max', target:'5', weightage:40, isShared:false,
          quarterlyAchievements:{ Q1:C('3.2','Strong retention strategy.'), Q2:C('4.1','Within target.'), Q3:OT('5.8','Slightly above — exit interviews actioned.'), Q4:C('3.5','Strong recovery.') }},
        { goalId:'G-RG-002', thrustArea:'Operational Excellence', title:'Sprint Velocity (Story Points)',
          uomType:'Numeric_Min', target:'80', weightage:35, isShared:false,
          quarterlyAchievements:{ Q1:C('88','Overachieved.'), Q2:C('85','On track.'), Q3:C('90','Best sprint yet.'), Q4:C('92','Outstanding.') }},
        { goalId:'G-RG-003', thrustArea:'Quality', title:'Escaped Defect Rate',
          uomType:'Numeric_Max', target:'5', weightage:25, isShared:false,
          quarterlyAchievements:{ Q1:C('3','Well within.'), Q2:C('4','Good.'), Q3:C('2','Excellent.'), Q4:C('1','Near zero — best in org.') }},
      ],
    });

    console.log('📋 10 Goal Sheets created');

    // ═════════════════════════════════════════════════════════════════════════
    // AUDIT LOGS
    // ═════════════════════════════════════════════════════════════════════════
    await AuditLog.create([
      { goalSheetId: johnSheet._id, changedBy: jane._id, timestamp: new Date('2026-01-15T10:30:00Z'),
        changes: [{ field:'status', oldValue:'Pending_Approval', newValue:'Approved' }] },
      { goalSheetId: johnSheet._id, changedBy: john._id, timestamp: new Date('2026-04-02T09:15:00Z'),
        changes: [{ field:'goals[Sales Units].Q1.actualAchievement', oldValue:'', newValue:'6000' }] },
      { goalSheetId: johnSheet._id, changedBy: jane._id, timestamp: new Date('2026-04-05T14:00:00Z'),
        changes: [{ field:'goals[Sales Units].Q1.managerComment', oldValue:'', newValue:'Excellent — 120% achievement.' }] },
      { goalSheetId: chenSheet._id, changedBy: jane._id, timestamp: new Date('2026-01-18T11:00:00Z'),
        changes: [{ field:'status', oldValue:'Pending_Approval', newValue:'Approved' }] },
      { goalSheetId: davidSheet._id, changedBy: bob._id, timestamp: new Date('2026-01-20T09:00:00Z'),
        changes: [{ field:'status', oldValue:'Pending_Approval', newValue:'Approved' }] },
      { goalSheetId: sanaSheet._id, changedBy: bob._id, timestamp: new Date('2026-01-22T10:00:00Z'),
        changes: [{ field:'status', oldValue:'Pending_Approval', newValue:'Approved' }] },
      { goalSheetId: meeraSheet._id, changedBy: nina._id, timestamp: new Date('2026-01-25T08:30:00Z'),
        changes: [{ field:'status', oldValue:'Pending_Approval', newValue:'Approved' }] },
      { goalSheetId: tomSheet._id, changedBy: raj._id, timestamp: new Date('2026-01-28T09:45:00Z'),
        changes: [{ field:'status', oldValue:'Pending_Approval', newValue:'Approved' }] },
      { goalSheetId: rohanSheet._id, changedBy: jane._id, timestamp: new Date('2026-01-30T10:15:00Z'),
        changes: [{ field:'status', oldValue:'Pending_Approval', newValue:'Approved' }] },
      { goalSheetId: johnSheet._id, changedBy: alex._id, timestamp: new Date('2026-02-01T08:00:00Z'),
        changes: [{ field:'Shared KPI injected: CSAT Score', oldValue:'', newValue:'target=85, uomType=Percentage_Min' }] },
    ]);

    console.log('📝 10 Audit log entries seeded');

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n✅ Seed complete!\n');
    console.log('QUICK LOGIN CREDENTIALS:');
    console.log('  Admin   : alex.rivera   / adm@2026');
    console.log('  Admin   : priya.kapoor  / adm@2026b');
    console.log('  Admin   : sam.obrien    / adm@2026c');
    console.log('  Manager : jane.smith    / mgr@2026');
    console.log('  Manager : bob.martinez  / mgr@2026b');
    console.log('  Manager : nina.patel    / mgr@2026c');
    console.log('  Manager : raj.mehta     / mgr@2026d');
    console.log('  Employee: john.doe      / emp@2026');
    console.log('  Employee: diana.emp     / emp@2026b');
    console.log('  Employee: alice.chen    / emp@2026c');
    console.log('  Employee: david.lee     / emp@2026d');
    console.log('  Employee: sana.mirza    / emp@2026e');
    console.log('  Employee: leo.costa     / emp@2026f');
    console.log('  Employee: meera.joshi   / emp@2026g');
    console.log('  Employee: tom.nguyen    / emp@2026h');
    console.log('  Employee: fia.andersen  / emp@2026i');
    console.log('  Employee: rohan.gupta   / emp@2026j');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seedData();

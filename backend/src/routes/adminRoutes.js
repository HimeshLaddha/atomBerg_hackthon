import express from 'express';
import GoalSheet from '../models/GoalSheet.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();
const ACTIVE_CYCLE = '2026-H1';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/broadcast-kpi
//
// Injects a shared KPI goal into the GoalSheet of each targeted employee.
// Accepts EITHER:
//   { employeeIds: ["EMP-003", "EMP-004"], ...kpiFields }  ← targeted mode
//   { department: "Engineering", ...kpiFields }            ← department mode
//
// The injected goal object carries:
//   isShared: true   → frontend renders Title/Thrust/UoM/Target as read-only
//   weightage: 0     → employee must rebalance manually before submitting
//
// If a sheet is already Approved+Locked and a KPI is pushed to it, the sheet
// is unlocked and reverted to Draft so the employee can re-submit with the
// new goal appended.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/broadcast-kpi', protect, admin, async (req, res) => {
  const { title, thrustArea, uomType, target, employeeIds, department } = req.body;

  // ── Validate required KPI fields ──────────────────────────────────────────
  if (!title?.trim())      return res.status(400).json({ message: 'KPI title is required.' });
  if (!thrustArea?.trim()) return res.status(400).json({ message: 'Thrust area is required.' });
  if (!uomType)            return res.status(400).json({ message: 'Unit of Measurement is required.' });
  if (!target?.trim())     return res.status(400).json({ message: 'Target value is required.' });

  const VALID_UOM = ['Numeric_Min', 'Percentage_Min', 'Numeric_Max', 'Percentage_Max', 'Zero-based', 'Timeline'];
  if (!VALID_UOM.includes(uomType)) {
    return res.status(400).json({ message: `Invalid uomType: ${uomType}` });
  }

  // ── Resolve target users ───────────────────────────────────────────────────
  let users = [];

  if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
    // Targeted mode: look up each userId
    const idList = employeeIds.map(id => id.trim()).filter(Boolean);
    users = await User.find({ userId: { $in: idList }, role: { $ne: 'Admin' } }).select('_id userId name').lean();

    // Report any IDs that were not found
    const foundIds = users.map(u => u.userId);
    const notFound = idList.filter(id => !foundIds.includes(id));
    if (notFound.length > 0) {
      return res.status(404).json({
        message: `The following Employee IDs were not found: ${notFound.join(', ')}.`,
      });
    }
  } else if (department?.trim()) {
    // Department broadcast mode
    users = await User.find({ department: department.trim(), role: { $ne: 'Admin' } }).select('_id userId name').lean();
  } else {
    return res.status(400).json({
      message: 'Provide either an array of employeeIds or a department name.',
    });
  }

  if (!users.length) {
    return res.status(404).json({ message: 'No eligible employees found for the given criteria.' });
  }

  // ── Build the shared goal object ───────────────────────────────────────────
  const sharedGoal = {
    goalId:     `KPI-${Date.now()}`,
    title:      title.trim(),
    thrustArea: thrustArea.trim(),
    uomType,
    target:     target.trim(),
    weightage:  0,       // employee sets this when rebalancing
    isShared:   true,
    quarterlyAchievements: {
      Q1: { actualAchievement: '', status: 'Not Started', managerComment: '' },
      Q2: { actualAchievement: '', status: 'Not Started', managerComment: '' },
      Q3: { actualAchievement: '', status: 'Not Started', managerComment: '' },
      Q4: { actualAchievement: '', status: 'Not Started', managerComment: '' },
    },
  };

  // ── Inject into each employee's GoalSheet ──────────────────────────────────
  let injectedCount  = 0;
  let skippedCount   = 0;
  const skippedNames = [];

  for (const user of users) {
    let sheet = await GoalSheet.findOne({ employeeId: user._id, cycle: ACTIVE_CYCLE });

    if (!sheet) {
      // Create a new draft sheet with just this KPI goal
      await GoalSheet.create({
        employeeId: user._id,
        cycle:      ACTIVE_CYCLE,
        status:     'Draft',
        isLocked:   false,
        goals:      [sharedGoal],
      });
      injectedCount++;
      continue;
    }

    // Skip if at max capacity
    if (sheet.goals.length >= 8) {
      skippedCount++;
      skippedNames.push(user.name);
      continue;
    }

    // Avoid duplicate KPI injection (same title)
    const alreadyHasKpi = sheet.goals.some(
      g => g.isShared && g.title.toLowerCase() === title.trim().toLowerCase()
    );
    if (alreadyHasKpi) {
      skippedCount++;
      skippedNames.push(`${user.name} (duplicate)`);
      continue;
    }

    sheet.goals.push(sharedGoal);

    // Unlock locked sheets so the employee can rebalance weightage and re-submit
    if (sheet.isLocked) {
      sheet.isLocked = false;
      sheet.status   = 'Draft';
    }

    await sheet.save();
    injectedCount++;
  }

  const message = [
    `Shared KPI "${title}" injected into ${injectedCount} employee sheet(s).`,
    skippedCount > 0 ? `Skipped ${skippedCount} (at max capacity or duplicate): ${skippedNames.join(', ')}.` : '',
  ].filter(Boolean).join(' ');

  return res.status(200).json({ message, injectedCount, skippedCount });
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/audit-logs
//
// Full AuditLog feed with changedBy and goalSheetId populated.
// Alias for /api/goals/audit — provided here so the AdminDashboard can
// use a semantically clear admin-namespace endpoint.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/audit-logs', protect, admin, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .select('-__v')
      .populate('changedBy', 'name role userId')
      .populate({ path: 'goalSheetId', select: 'cycle', populate: { path: 'employeeId', select: 'name userId' } })
      .sort({ timestamp: -1 })
      .lean();

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/completion-summary
//
// Returns per-employee completion stats used by the Completion Tracker Board.
// Pulls all GoalSheets (any status) and computes:
//   - submissionComplete: sheet.status === 'Approved'
//   - quarterlyComplete:  all Q1-Q4 goals have status 'Completed'
//   - managerCheckinDone: all goals have a non-empty managerComment for every Q
// ─────────────────────────────────────────────────────────────────────────────
router.get('/completion-summary', protect, admin, async (req, res) => {
  try {
    const sheets = await GoalSheet.find({ cycle: ACTIVE_CYCLE })
      .select('employeeId status isLocked goals')
      .populate('employeeId', 'name userId department role')
      .lean();

    const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

    const summary = sheets
      .filter(s => s.employeeId && s.employeeId.role === 'Employee')
      .map(sheet => {
        const total = sheet.goals.length;

        const quarterStats = QUARTERS.reduce((acc, q) => {
          const completedGoals = sheet.goals.filter(
            g => g.quarterlyAchievements?.[q]?.status === 'Completed'
          ).length;
          const checkedInGoals = sheet.goals.filter(
            g => g.quarterlyAchievements?.[q]?.managerComment?.trim()
          ).length;

          acc[q] = {
            completed:  completedGoals,
            total,
            checkedIn:  checkedInGoals,
            pctDone:    total > 0 ? Math.round((completedGoals / total) * 100) : 0,
          };
          return acc;
        }, {});

        const overallCompleted = QUARTERS.reduce((s, q) => s + quarterStats[q].completed, 0);
        const overallPct       = total > 0 ? Math.round(overallCompleted / (total * 4) * 100) : 0;
        const allCheckedIn     = QUARTERS.every(q => quarterStats[q].checkedIn === total);

        return {
          employeeId:          sheet.employeeId.userId,
          employeeName:        sheet.employeeId.name,
          department:          sheet.employeeId.department,
          sheetId:             sheet._id,
          sheetStatus:         sheet.status,
          isLocked:            sheet.isLocked,
          totalGoals:          total,
          submissionComplete:  sheet.status === 'Approved',
          allCheckedIn,
          overallPct,
          quarterStats,
        };
      });

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/provision-user
//
// Dynamically creates a new employee record and initializes a fresh, empty
// GoalSheet document for the current cycle ('2026-H1').
// ─────────────────────────────────────────────────────────────────────────────
router.post('/provision-user', protect, admin, async (req, res) => {
  try {
    const { name, email, userId, username, password, department, managerId } = req.body;

    // Validate payload fields
    if (!name?.trim())       return res.status(400).json({ message: 'Full Name is required.' });
    if (!email?.trim())      return res.status(400).json({ message: 'Corporate Email is required.' });
    if (!userId?.trim())     return res.status(400).json({ message: 'User ID is required.' });
    if (!username?.trim())   return res.status(400).json({ message: 'Username is required.' });
    if (!password)           return res.status(400).json({ message: 'Password is required.' });
    if (!department?.trim()) return res.status(400).json({ message: 'Department is required.' });

    // Check duplicate conflicts
    const duplicateEmail = await User.findOne({ email: email.trim().toLowerCase() });
    if (duplicateEmail) {
      return res.status(400).json({ message: `Conflict: Email '${email}' is already in use.` });
    }

    const duplicateUserId = await User.findOne({ userId: userId.trim().toUpperCase() });
    if (duplicateUserId) {
      return res.status(400).json({ message: `Conflict: User ID '${userId}' is already in use.` });
    }

    const duplicateUsername = await User.findOne({ username: username.trim().toLowerCase() });
    if (duplicateUsername) {
      return res.status(400).json({ message: `Conflict: Username '${username}' is already in use.` });
    }

    const role = 'Employee'; // Default hardcoded to 'Employee'

    // Create and save new user record
    const newUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      userId: userId.trim().toUpperCase(),
      username: username.trim().toLowerCase(),
      password, // hashed automatically by User model pre-save hook
      role,
      department: department.trim(),
      managerId: managerId || null,
    });

    await newUser.save();

    // Automatically initialize a clean, empty GoalSheet document for the new user
    const newGoalSheet = new GoalSheet({
      employeeId: newUser._id,
      cycle: ACTIVE_CYCLE,
      status: 'Draft',
      isLocked: false,
      goals: [],
    });

    await newGoalSheet.save();

    res.status(201).json({
      message: 'User provisioned successfully and H1 cycle workspace authorized.',
      user: {
        _id: newUser._id,
        userId: newUser.userId,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        managerId: newUser.managerId,
      },
      goalSheetId: newGoalSheet._id,
    });
  } catch (error) {
    console.error('Provisioning error:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
});


export default router;

import express from 'express';
import GoalSheet from '../models/GoalSheet.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { appendAuditLog } from '../utils/auditLogger.js';
import { sanitizeGoals } from '../utils/goalSanitizer.js';

const router = express.Router();
const ACTIVE_CYCLE = '2026-H1';

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const validateGoalArray = (goals) => {
  const errors = [];

  if (!Array.isArray(goals) || goals.length === 0) {
    errors.push('At least one goal is required.');
    return errors;
  }
  if (goals.length > 8) {
    errors.push(`Maximum of 8 goals allowed. You have ${goals.length}.`);
  }

  const totalWeightage = goals.reduce((sum, g) => sum + (Number(g.weightage) || 0), 0);
  if (Math.abs(totalWeightage - 100) > 0.01) {
    errors.push(`Total weightage must equal exactly 100%. Current total: ${totalWeightage}%.`);
  }

  goals.forEach((g, i) => {
    if ((Number(g.weightage) || 0) < 10) {
      errors.push(`Goal ${i + 1} ("${g.title || 'Untitled'}"): minimum weightage is 10%. Got ${g.weightage}%.`);
    }
  });

  return errors;
};


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/goals?userId=...
// Returns active GoalSheet OR { exists: false, status: "Draft" }
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId query parameter is required' });

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const sheet = await GoalSheet.findOne({ employeeId: user._id, cycle: ACTIVE_CYCLE });
    if (sheet) {
      return res.status(200).json(sheet);
    }
    // No sheet found — signal the frontend to render the creation form
    return res.status(200).json({ exists: false, status: 'Draft' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/goals/team/subordinates?managerId=...
// Returns all direct reports + their GoalSheet status flags
// ─────────────────────────────────────────────────────────────────────────────
router.get('/team/subordinates', async (req, res) => {
  const { managerId } = req.query;
  if (!managerId) return res.status(400).json({ message: 'managerId query parameter is required' });

  try {
    const manager = await User.findOne({ userId: managerId });
    if (!manager) return res.status(404).json({ message: 'Manager not found' });

    const subordinates = await User.find({ managerId: manager._id });

    const teamData = await Promise.all(subordinates.map(async (sub) => {
      const sheet = await GoalSheet.findOne({ employeeId: sub._id, cycle: ACTIVE_CYCLE });
      return {
        _id: sub._id,
        userId: sub.userId,
        name: sub.name,
        email: sub.email,
        department: sub.department,
        goalSheetStatus: sheet ? sheet.status : 'Not Started',
        goalSheetId: sheet ? sheet._id : null
      };
    }));

    res.status(200).json(teamData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/goals/pending — Manager: list pending sheets for direct reports
// ─────────────────────────────────────────────────────────────────────────────
router.get('/pending', async (req, res) => {
  const { managerId } = req.query;
  try {
    const manager = await User.findOne({ userId: managerId });
    if (!manager) return res.status(404).json({ message: 'Manager not found' });

    const pendingSheets = await GoalSheet.find({ status: 'Pending_Approval' })
      .populate({ path: 'employeeId', match: { managerId: manager._id }, select: 'name email department' });

    res.status(200).json(pendingSheets.filter(s => s.employeeId != null));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/goals/team-approved — Manager: list approved/locked sheets for direct reports
// ─────────────────────────────────────────────────────────────────────────────
router.get('/team-approved', async (req, res) => {
  const { managerId } = req.query;
  try {
    const manager = await User.findOne({ userId: managerId });
    if (!manager) return res.status(404).json({ message: 'Manager not found' });

    const approvedSheets = await GoalSheet.find({ status: 'Approved' })
      .populate({ path: 'employeeId', match: { managerId: manager._id }, select: 'name email department userId' });

    res.status(200).json(approvedSheets.filter(s => s.employeeId != null));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/goals/approved — Admin: all approved sheets org-wide
// ─────────────────────────────────────────────────────────────────────────────
router.get('/approved', async (req, res) => {
  try {
    const sheets = await GoalSheet.find({ status: 'Approved' })
      .populate('employeeId', 'name email department userId');
    res.status(200).json(sheets.filter(s => s.employeeId != null));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/goals/audit — Admin: fetch audit logs
// ─────────────────────────────────────────────────────────────────────────────
router.get('/audit', async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('changedBy', 'name role')
      .populate('goalSheetId', 'cycle employeeId')
      .sort({ timestamp: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/goals/:employeeId/:cycle — Fetch a specific sheet by user + cycle
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:employeeId/:cycle', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.employeeId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const sheet = await GoalSheet.findOne({ employeeId: user._id, cycle: req.params.cycle });
    res.status(200).json(sheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/goals/save — Employee saves a draft (no validation required)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/save', async (req, res) => {
  const { employeeId, cycle, goals } = req.body;

  try {
    const user = await User.findOne({ userId: employeeId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let sheet = await GoalSheet.findOne({ employeeId: user._id, cycle });

    if (sheet) {
      if (sheet.isLocked) return res.status(403).json({ message: 'Goal sheet is locked and cannot be edited.' });
      sheet.goals = sanitizeGoals(goals);
      sheet.status = 'Draft';
      await sheet.save();
    } else {
      sheet = await GoalSheet.create({ employeeId: user._id, cycle, status: 'Draft', goals: sanitizeGoals(goals) });
    }

    res.status(200).json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/goals/submit
// Validates: max 8 goals, 100% total weightage, each ≥ 10%, then sets Pending_Approval
// ─────────────────────────────────────────────────────────────────────────────
router.post('/submit', async (req, res) => {
  const { employeeId, cycle, goals } = req.body;

  // 1. Server-side business rule validation (BRD constraints)
  const validationErrors = validateGoalArray(goals);
  if (validationErrors.length > 0) {
    return res.status(400).json({ message: validationErrors.join(' ') });
  }

  try {
    const user = await User.findOne({ userId: employeeId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let sheet = await GoalSheet.findOne({ employeeId: user._id, cycle });

    // 2. Sanitize goals to ensure quarterlyAchievements are proper objects,
    //    not the empty-string primitives that a previous draft-save may have written.
    //    This prevents downstream crashes in the quarterly $set update route.
    const sanitized = sanitizeGoals(goals);

    if (sheet) {
      if (sheet.isLocked) return res.status(403).json({ message: 'Goal sheet is locked and cannot be submitted.' });
      sheet.goals = sanitized;
      sheet.status = 'Pending_Approval';
      await sheet.save();
    } else {
      sheet = await GoalSheet.create({ employeeId: user._id, cycle, status: 'Pending_Approval', goals: sanitized });
    }

    res.status(200).json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/goals/approve
// Manager approves a sheet: sets status = 'Approved' and isLocked = true
// ─────────────────────────────────────────────────────────────────────────────
router.post('/approve', async (req, res) => {
  const { sheetId, goals, changedBy } = req.body;

  try {
    const sheet = await GoalSheet.findById(sheetId);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });
    if (sheet.status !== 'Pending_Approval') {
      return res.status(400).json({ message: 'Only sheets with Pending_Approval status can be approved.' });
    }

    // Apply any manager-made inline edits before locking
    if (goals) {
      const validationErrors = validateGoalArray(goals);
      if (validationErrors.length > 0) {
        return res.status(400).json({ message: validationErrors.join(' ') });
      }
      sheet.goals = goals;
    }

    sheet.status = 'Approved';
    sheet.isLocked = true;
    await sheet.save();

    await appendAuditLog({
      goalSheetId: sheet._id,
      changedByUserId: changedBy,
      changes: [{ field: 'status', oldValue: 'Pending_Approval', newValue: 'Approved' }]
    });

    res.status(200).json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/goals/review/:sheetId — Manager inline review + approve or return
// (kept for backward compatibility with ManagerReview.jsx)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/review/:sheetId', async (req, res) => {
  const { action, goals, changedBy } = req.body;

  try {
    const sheet = await GoalSheet.findById(req.params.sheetId);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    if (goals) {
      // Server-side BRD constraint check on manager inline edits —
      // mirrors the same validation enforced by POST /approve.
      // Prevents a manager bypassing the 100% total / ≥10% per-goal rules
      // via direct PUT even if the client-side guard is bypassed.
      if (action === 'approve') {
        const validationErrors = validateGoalArray(goals);
        if (validationErrors.length > 0) {
          return res.status(400).json({ message: validationErrors.join(' ') });
        }
      }
      sheet.goals = sanitizeGoals(goals);
    }

    const oldStatus = sheet.status;
    if (action === 'approve') {
      sheet.status = 'Approved';
      sheet.isLocked = true;
    } else if (action === 'return') {
      sheet.status = 'Draft';
      sheet.isLocked = false;
    }

    await sheet.save();

    await appendAuditLog({
      goalSheetId: sheet._id,
      changedByUserId: changedBy,
      changes: [{ field: 'status', oldValue: oldStatus, newValue: sheet.status }]
    });

    res.status(200).json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/goals/quarterly/:sheetId — Employee logs quarterly achievements
// Captures post-lock mutations in AuditLog
// ─────────────────────────────────────────────────────────────────────────────
router.put('/quarterly/:sheetId', async (req, res) => {
  const { goalId, quarter, actualAchievement, status, changedBy } = req.body;

  const VALID_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
  if (!VALID_QUARTERS.includes(quarter)) {
    return res.status(400).json({ message: `Invalid quarter: ${quarter}` });
  }

  try {
    const sheet = await GoalSheet.findById(req.params.sheetId);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });
    if (!sheet.isLocked) {
      return res.status(400).json({ message: 'Sheet must be approved and locked before quarterly tracking.' });
    }

    const goal = sheet.goals.id(goalId);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const oldAchievement = goal.quarterlyAchievements?.[quarter]?.actualAchievement ?? '';
    const oldStatus = goal.quarterlyAchievements?.[quarter]?.status ?? 'Not Started';

    // Use $set with dot-notation to only touch this specific quarter —
    // avoids the full re-save which coerces untouched quarterlyAchievement
    // sub-docs to primitive '' and triggers Mongoose validation failure.
    const goalIndex = sheet.goals.findIndex(g => g._id.toString() === goalId);
    if (goalIndex === -1) return res.status(404).json({ message: 'Goal index not found' });

    const updatePath = `goals.${goalIndex}.quarterlyAchievements.${quarter}`;
    const updatedSheet = await GoalSheet.findByIdAndUpdate(
      req.params.sheetId,
      {
        $set: {
          // Replace the entire quarter sub-doc in one operation.
          // This safely overwrites the corrupt "" primitive that older
          // draft saves wrote, since MongoDB cannot dot-navigate into a string.
          [updatePath]: {
            actualAchievement: actualAchievement ?? '',
            status: status ?? 'Not Started',
            managerComment: goal.quarterlyAchievements?.[quarter]?.managerComment ?? ''
          }
        }
      },
      { new: true, runValidators: false }
    );

    // Audit the change
    await appendAuditLog({
      goalSheetId: sheet._id,
      changedByUserId: changedBy,
      changes: [
        { field: `goals["${goal.title}"].${quarter}.actualAchievement`, oldValue: oldAchievement, newValue: actualAchievement },
        { field: `goals["${goal.title}"].${quarter}.status`, oldValue: oldStatus, newValue: status }
      ].filter(c => c.oldValue !== c.newValue)
    });

    res.status(200).json(updatedSheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/goals/manager-checkin/:sheetId — Manager saves check-in + status
// Captured in AuditLog as post-lock modification
// ─────────────────────────────────────────────────────────────────────────────
router.put('/manager-checkin/:sheetId', async (req, res) => {
  const { goalId, quarter, managerComment, status, changedBy } = req.body;

  const VALID_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
  if (!VALID_QUARTERS.includes(quarter)) {
    return res.status(400).json({ message: `Invalid quarter: ${quarter}` });
  }

  try {
    const sheet = await GoalSheet.findById(req.params.sheetId);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    const goal = sheet.goals.id(goalId);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const oldComment = goal.quarterlyAchievements[quarter]?.managerComment ?? '';
    const oldStatus  = goal.quarterlyAchievements[quarter]?.status ?? 'Not Started';

    // Guard: initialize the quarter sub-doc if it is missing or corrupt
    if (!goal.quarterlyAchievements[quarter] || typeof goal.quarterlyAchievements[quarter] !== 'object') {
      goal.quarterlyAchievements[quarter] = { actualAchievement: '', status: 'Not Started', managerComment: '' };
    }

    goal.quarterlyAchievements[quarter].managerComment = managerComment ?? '';

    // Persist manager-set status if provided (Completed / On Track / Not Started)
    if (status && ['Not Started', 'On Track', 'Completed'].includes(status)) {
      goal.quarterlyAchievements[quarter].status = status;
    }

    await sheet.save();

    await appendAuditLog({
      goalSheetId: sheet._id,
      changedByUserId: changedBy,
      changes: [
        {
          field: `goals["${goal.title}"].${quarter}.managerComment`,
          oldValue: oldComment,
          newValue: managerComment
        },
        {
          field: `goals["${goal.title}"].${quarter}.status`,
          oldValue: oldStatus,
          newValue: status ?? oldStatus
        }
      ].filter(c => c.oldValue !== c.newValue)
    });

    res.status(200).json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



// ─────────────────────────────────────────────────────────────────────────────
// POST /api/goals/shared-kpi — Admin pushes a shared KPI to a department
// ─────────────────────────────────────────────────────────────────────────────
router.post('/shared-kpi', async (req, res) => {
  const { title, thrustArea, uomType, target, department } = req.body;

  try {
    const users = await User.find({ department, role: { $ne: 'Admin' } });

    const sharedGoal = {
      goalId: `KPI-${Date.now()}`,
      title,
      thrustArea,
      uomType,
      target,
      weightage: 0, // Employee must allocate weightage manually when rebalancing their sheet
      isShared: true
    };

    let updatedCount = 0;
    for (const user of users) {
      const sheet = await GoalSheet.findOne({ employeeId: user._id, cycle: ACTIVE_CYCLE });
      if (sheet && sheet.goals.length < 8) {
        sheet.goals.push(sharedGoal);
        if (sheet.isLocked) {
          sheet.isLocked = false;
          sheet.status = 'Draft';
        }
        await sheet.save();
        updatedCount++;
      }
    }

    res.status(200).json({ message: `Shared KPI pushed to ${updatedCount} employee(s).` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



// ─────────────────────────────────────────────────────────────────────────────
// POST /api/goals/checkin — BRD-spec alias for manager check-in comment
// Body: { sheetId, goalId, quarter, managerComment, changedBy }
// Delegates to the same logic as PUT /api/goals/manager-checkin/:sheetId
// ─────────────────────────────────────────────────────────────────────────────
router.post('/checkin', async (req, res) => {
  const { sheetId, goalId, quarter, managerComment, changedBy } = req.body;

  if (!sheetId) return res.status(400).json({ message: 'sheetId is required in the request body.' });

  try {
    const sheet = await GoalSheet.findById(sheetId);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    const goal = sheet.goals.id(goalId);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const oldComment = goal.quarterlyAchievements[quarter]?.managerComment ?? '';

    // Guard: initialize the quarter sub-doc if it is missing or corrupt
    if (!goal.quarterlyAchievements[quarter] || typeof goal.quarterlyAchievements[quarter] !== 'object') {
      goal.quarterlyAchievements[quarter] = { actualAchievement: '', status: 'Not Started', managerComment: '' };
    }
    goal.quarterlyAchievements[quarter].managerComment = managerComment ?? '';

    await sheet.save();

    await appendAuditLog({
      goalSheetId:      sheet._id,
      changedByUserId:  changedBy,
      changes: [{
        field:    `goals["${goal.title}"].${quarter}.managerComment`,
        oldValue: oldComment,
        newValue: managerComment,
      }].filter(c => c.oldValue !== c.newValue),
    });

    res.status(200).json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


export default router;


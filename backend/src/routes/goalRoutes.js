import express from 'express';
import GoalSheet from '../models/GoalSheet.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

const router = express.Router();

// GET all pending goal sheets for a manager's direct reports
router.get('/pending', async (req, res) => {
  // In a real app, managerId would come from auth context
  const { managerId } = req.query; 
  try {
    const manager = await User.findOne({ userId: managerId });
    if (!manager) return res.status(404).json({ message: 'Manager not found' });

    // Populate employee details to show names in the Manager Dashboard
    const pendingSheets = await GoalSheet.find({ status: 'Pending_Approval' })
                                         .populate({
                                           path: 'employeeId',
                                           match: { managerId: manager._id },
                                           select: 'name email department'
                                         });
    
    // Filter out nulls from the population match
    const filteredSheets = pendingSheets.filter(sheet => sheet.employeeId != null);
    res.json(filteredSheets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all approved goal sheets for a manager's direct reports (for tracking)
router.get('/team-approved', async (req, res) => {
  const { managerId } = req.query; 
  try {
    const manager = await User.findOne({ userId: managerId });
    if (!manager) return res.status(404).json({ message: 'Manager not found' });

    const approvedSheets = await GoalSheet.find({ status: 'Approved' })
                                         .populate({
                                           path: 'employeeId',
                                           match: { managerId: manager._id },
                                           select: 'name email department'
                                         });
    
    const filteredSheets = approvedSheets.filter(sheet => sheet.employeeId != null);
    res.json(filteredSheets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all approved/locked goal sheets across the organization
router.get('/approved', async (req, res) => {
  try {
    const approvedSheets = await GoalSheet.find({ status: 'Approved' })
                                          .populate('employeeId', 'name email department');
    
    // Filter out nulls in case users were deleted
    const filteredSheets = approvedSheets.filter(sheet => sheet.employeeId != null);
    res.json(filteredSheets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET specific goal sheet by Employee ID and Cycle
router.get('/:employeeId/:cycle', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.employeeId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const sheet = await GoalSheet.findOne({ 
      employeeId: user._id, 
      cycle: req.params.cycle 
    });
    res.json(sheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /submit (Employee submits or updates their draft)
router.post('/submit', async (req, res) => {
  const { employeeId, cycle, goals } = req.body;
  
  try {
    const user = await User.findOne({ userId: employeeId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let sheet = await GoalSheet.findOne({ employeeId: user._id, cycle });
    
    if (sheet) {
      if (sheet.isLocked) return res.status(403).json({ message: 'Goal sheet is locked' });
      sheet.goals = goals;
      sheet.status = 'Pending_Approval';
      await sheet.save();
    } else {
      sheet = await GoalSheet.create({
        employeeId: user._id,
        cycle,
        status: 'Pending_Approval',
        goals
      });
    }
    res.status(200).json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /review/:sheetId (Manager reviews, edits, approves or returns)
router.put('/review/:sheetId', async (req, res) => {
  const { action, goals, changedBy } = req.body; // action: 'approve' or 'return'
  
  try {
    const sheet = await GoalSheet.findById(req.params.sheetId);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });
    
    if (goals) sheet.goals = goals; // apply inline edits
    
    if (action === 'approve') {
      sheet.status = 'Approved';
      sheet.isLocked = true;
    } else if (action === 'return') {
      sheet.status = 'Draft';
      sheet.isLocked = false;
    }
    
    await sheet.save();
    
    // Look up the actual User _id for the AuditLog
    const user = await User.findOne({ userId: changedBy });
    
    if (user) {
      await AuditLog.create({
        goalSheetId: sheet._id,
        changedBy: user._id,
        changes: [{ field: 'status', newValue: sheet.status }]
      });
    }

    res.status(200).json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /quarterly/:sheetId (Employee updates actual achievements)
router.put('/quarterly/:sheetId', async (req, res) => {
  const { goalId, quarter, actualAchievement, status, changedBy } = req.body;
  
  try {
    const sheet = await GoalSheet.findById(req.params.sheetId);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });
    if (!sheet.isLocked) return res.status(400).json({ message: 'Sheet must be approved/locked before quarterly tracking' });

    const goal = sheet.goals.id(goalId);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const oldValue = goal.quarterlyAchievements[quarter].actualAchievement;
    const oldStatus = goal.quarterlyAchievements[quarter].status;

    goal.quarterlyAchievements[quarter].actualAchievement = actualAchievement;
    goal.quarterlyAchievements[quarter].status = status;
    
    await sheet.save();

    const user = await User.findOne({ userId: changedBy });
    if (user) {
      await AuditLog.create({
        goalSheetId: sheet._id,
        changedBy: user._id,
        changes: [
          { field: `goals.${goal.title}.quarterlyAchievements.${quarter}.actualAchievement`, oldValue, newValue: actualAchievement },
          { field: `goals.${goal.title}.quarterlyAchievements.${quarter}.status`, oldValue: oldStatus, newValue: status }
        ]
      });
    }

    res.status(200).json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /manager-checkin/:sheetId (Manager check-in comments)
router.put('/manager-checkin/:sheetId', async (req, res) => {
  const { goalId, quarter, managerComment, changedBy } = req.body;

  try {
    const sheet = await GoalSheet.findById(req.params.sheetId);
    if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

    const goal = sheet.goals.id(goalId);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const oldValue = goal.quarterlyAchievements[quarter].managerComment;
    goal.quarterlyAchievements[quarter].managerComment = managerComment;
    
    await sheet.save();

    const user = await User.findOne({ userId: changedBy });
    if (user) {
      await AuditLog.create({
        goalSheetId: sheet._id,
        changedBy: user._id,
        changes: [{ field: `goals.${goal.title}.quarterlyAchievements.${quarter}.managerComment`, oldValue, newValue: managerComment }]
      });
    }

    res.status(200).json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /shared-kpi (Admin pushes shared KPI)
router.post('/shared-kpi', async (req, res) => {
  const { title, thrustArea, uomType, target, department } = req.body;

  try {
    // Find all users in department
    const users = await User.find({ department, role: { $ne: 'Admin/HR' } });
    
    const sharedGoal = {
      goalId: `KPI-${Date.now()}`,
      title,
      thrustArea,
      uomType,
      target,
      weightage: 10, // Default weightage
      isShared: true
    };

    let updatedCount = 0;
    for (const user of users) {
      // Find current active cycle sheet (for hackathon, assuming 2026-H1)
      const sheet = await GoalSheet.findOne({ employeeId: user._id, cycle: '2026-H1' });
      if (sheet && sheet.goals.length < 8) {
        sheet.goals.push(sharedGoal);
        
        // If it was locked, we technically shouldn't alter the math without unlocking or balancing, 
        // but for MVP, we'll append it. The user will need to adjust weightages.
        if (sheet.isLocked) {
          sheet.isLocked = false;
          sheet.status = 'Draft'; // Return to draft to balance weightages
        }
        
        await sheet.save();
        updatedCount++;
      }
    }

    res.status(200).json({ message: `Shared KPI pushed to ${updatedCount} employees.` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /audit (Fetch Audit Logs)
router.get('/audit', async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('changedBy', 'name role').populate('goalSheetId', 'cycle employeeId').sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

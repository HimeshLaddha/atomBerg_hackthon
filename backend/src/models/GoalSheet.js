import mongoose from 'mongoose';

const quarterlyUpdateSchema = new mongoose.Schema({
  actualAchievement: { type: String, default: '' },
  status: { type: String, enum: ['Not Started', 'On Track', 'Completed'], default: 'Not Started' },
  managerComment: { type: String, default: '' }
}, { _id: false });

const goalSchema = new mongoose.Schema({
  goalId: {
    type: String,
    required: true
  },
  thrustArea: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  uomType: {
    type: String,
    enum: ['Numeric_Min', 'Percentage_Min', 'Numeric_Max', 'Percentage_Max', 'Zero-based', 'Timeline'],
    required: true
  },
  target: {
    type: String, // String to handle diverse inputs like dates, numbers, etc.
    required: true
  },
  weightage: {
    type: Number,
    required: true
    // min: 10 enforced only at /submit time via validateGoalArray(), not on draft saves
  },
  isShared: {
    type: Boolean,
    default: false
  },
  quarterlyAchievements: {
    Q1: { type: quarterlyUpdateSchema, default: () => ({}) },
    Q2: { type: quarterlyUpdateSchema, default: () => ({}) },
    Q3: { type: quarterlyUpdateSchema, default: () => ({}) },
    Q4: { type: quarterlyUpdateSchema, default: () => ({}) }
  }
});

const goalSheetSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cycle: {
    type: String, // e.g., "2026-H1"
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending_Approval', 'Approved'],
    default: 'Draft'
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  goals: {
    type: [goalSchema],
    validate: {
      validator: function(goals) {
        return goals.length <= 8;
      },
      message: 'A Goal Sheet can have a maximum of 8 goals.'
    }
  }
}, { timestamps: true });

// Note: 100% weightage validation is intentionally NOT in the pre-save hook.
// It is enforced only at /submit time via validateGoalArray().
// This allows:
//   1. Draft saves with any total (employees iterate freely)
//   2. Shared KPI injection (starts at 0%, employee rebalances before submitting)


const GoalSheet = mongoose.model('GoalSheet', goalSheetSchema);
export default GoalSheet;

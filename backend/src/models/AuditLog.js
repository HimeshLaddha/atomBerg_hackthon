import mongoose from 'mongoose';

const changeSchema = new mongoose.Schema({
  field: { type: String, required: true },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const auditLogSchema = new mongoose.Schema({
  goalSheetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoalSheet',
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  changes: [changeSchema]
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;

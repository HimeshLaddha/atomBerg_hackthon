import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

/**
 * Appends a structured record to the AuditLog collection for any
 * post-lock mutation. Should be called after a successful save
 * whenever isLocked === true.
 *
 * @param {object} params
 * @param {string} params.goalSheetId   - MongoDB _id of the GoalSheet document
 * @param {string} params.changedByUserId - Human-readable userId string (e.g. "EMP-002")
 * @param {Array}  params.changes       - Array of { field, oldValue, newValue }
 */
export const appendAuditLog = async ({ goalSheetId, changedByUserId, changes }) => {
  if (!changes || changes.length === 0) return;

  try {
    const user = await User.findOne({ userId: changedByUserId });
    if (!user) {
      console.warn(`[AuditLog] Could not find user "${changedByUserId}" — log skipped.`);
      return;
    }

    await AuditLog.create({
      goalSheetId,
      changedBy: user._id,
      timestamp: new Date(),
      changes
    });
  } catch (err) {
    // Never throw from audit logger — log silently and let the main operation succeed
    console.error('[AuditLog] Failed to write audit record:', err.message);
  }
};

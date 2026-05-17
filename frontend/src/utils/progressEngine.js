/**
 * Calculates goal progress percentage based on Unit of Measurement (UoM) type.
 * 
 * Formula Matrix (per spec):
 *   Numeric_Min / Percentage_Min  → Higher is better: (achievement / target) * 100
 *   Numeric_Max / Percentage_Max  → Lower is better:  (target / achievement) * 100
 *   Zero-based                    → achievement === 0 ? 100 : 0
 *   Timeline                      → Date comparison against deadline target string
 *
 * @param {string} uomType    - One of the defined UoM enum values
 * @param {string} target     - The planned target value (may be a number or date string)
 * @param {string} achievement - The logged actual achievement value
 * @returns {number} Progress percentage clamped to [0, 100]
 */
export const calculateGoalProgress = (uomType, target, achievement) => {
  // Guard: no achievement entered yet
  if (achievement === null || achievement === undefined || String(achievement).trim() === '') {
    return 0;
  }

  const targetNum = parseFloat(target);
  const achievementNum = parseFloat(achievement);

  switch (uomType) {
    // ── HIGHER IS BETTER ──────────────────────────────────────────────────
    // Min = minimum floor. Achieving MORE than the target is success.
    // e.g. Target: 100 sales, Actual: 120 → 120%
    case 'Numeric_Min':
    case 'Percentage_Min': {
      if (isNaN(targetNum) || targetNum === 0) return 0; // edge: no target or zero target
      if (isNaN(achievementNum)) return 0;
      const progress = (achievementNum / targetNum) * 100;
      return Math.min(Math.max(Math.round(progress), 0), 100);
    }

    // ── LOWER IS BETTER ───────────────────────────────────────────────────
    // Max = maximum ceiling. Staying UNDER the target is success.
    // e.g. Target: 50 defects, Actual: 100 → 50%
    case 'Numeric_Max':
    case 'Percentage_Max': {
      if (isNaN(targetNum) || targetNum === 0) return 0;
      if (isNaN(achievementNum) || achievementNum === 0) return 100; // edge: zero actual = perfect for "lower is better"
      const progress = (targetNum / achievementNum) * 100;
      return Math.min(Math.max(Math.round(progress), 0), 100);
    }

    // ── ZERO INCIDENTS ────────────────────────────────────────────────────
    // Zero actual events logged = 100% success.
    case 'Zero-based': {
      if (isNaN(achievementNum)) return 0;
      return achievementNum === 0 ? 100 : 0;
    }

    // ── TIMELINE / DATE ───────────────────────────────────────────────────
    // Compares the completion date against the deadline.
    // On-time or early = 100%, late = proportional penalty based on overrun.
    case 'Timeline': {
      const targetDate = new Date(target);
      const actualDate = new Date(achievement);

      // If both parse as valid dates:
      if (!isNaN(targetDate.getTime()) && !isNaN(actualDate.getTime())) {
        if (actualDate <= targetDate) return 100;
        // Proportional penalty: % of overrun relative to target deadline
        const targetMs = targetDate.getTime();
        const actualMs = actualDate.getTime();
        // We score 0 if overrun by more than the full deadline duration
        const overrunRatio = (actualMs - targetMs) / targetMs;
        const score = Math.max(0, 100 - Math.round(overrunRatio * 100));
        return score;
      }

      // Fallback: exact string match (e.g., "Q1 End" === "Q1 End")
      return achievement.trim().toLowerCase() === target.trim().toLowerCase() ? 100 : 0;
    }

    default:
      return 0;
  }
};

// Backward-compat alias for any existing imports using the old name
export const calculateProgress = calculateGoalProgress;

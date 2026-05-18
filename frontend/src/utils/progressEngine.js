/**
 * Progress Engine — BRD Formula Matrix
 *
 *   Numeric_Min / Percentage_Min  → Higher is better: (achievement / target) × 100
 *   Numeric_Max / Percentage_Max  → Lower is better:  (target / achievement) × 100
 *   Zero-based                    → achievement === 0 ? 100 : 0
 *   Timeline                      → Date comparison against ISO deadline string
 *
 * Two exported variants:
 *   calculateRawProgress()  — returns the unclamped value (e.g. 120 for overachievement)
 *                             Use for DISPLAY badges where '>100%' is meaningful.
 *   calculateGoalProgress() — clamps result to [0, 100]
 *                             Use for CSS progress bar widths.
 */

/**
 * Core computation — unclamped.
 * @param {string} uomType
 * @param {string} target
 * @param {string} achievement
 * @returns {number} Raw percentage (can exceed 100 for overachievement)
 */
export const calculateRawProgress = (uomType, target, achievement) => {
  // Guard: no achievement entered yet
  if (achievement === null || achievement === undefined || String(achievement).trim() === '') {
    return 0;
  }

  const targetNum      = parseFloat(target);
  const achievementNum = parseFloat(achievement);

  switch (uomType) {
    // ── HIGHER IS BETTER ─────────────────────────────────────────────────
    // Min = minimum floor. Achieving MORE than the target is overachievement.
    // e.g. Target: 100 sales, Actual: 120 → raw 120%, clamped 100%
    case 'Numeric_Min':
    case 'Percentage_Min': {
      if (isNaN(targetNum) || targetNum === 0) return 0;
      if (isNaN(achievementNum)) return 0;
      return Math.max(Math.round((achievementNum / targetNum) * 100), 0);
    }

    // ── LOWER IS BETTER ──────────────────────────────────────────────────
    // Max = maximum ceiling. Staying UNDER the target is success.
    // e.g. Target: 50 defects, Actual: 100 → 50%
    case 'Numeric_Max':
    case 'Percentage_Max': {
      if (isNaN(targetNum) || targetNum === 0) return 0;
      if (isNaN(achievementNum) || achievementNum === 0) return 100;
      return Math.max(Math.round((targetNum / achievementNum) * 100), 0);
    }

    // ── ZERO INCIDENTS ───────────────────────────────────────────────────
    // Zero actual events logged = 100% success; anything > 0 = 0%.
    case 'Zero-based': {
      if (isNaN(achievementNum)) return 0;
      return achievementNum === 0 ? 100 : 0;
    }

    // ── TIMELINE / DATE ──────────────────────────────────────────────────
    // On-time or early = 100%.
    // Late = proportional deduction based on how far past the deadline.
    case 'Timeline': {
      const targetDate = new Date(target);
      const actualDate = new Date(achievement);

      if (!isNaN(targetDate.getTime()) && !isNaN(actualDate.getTime())) {
        if (actualDate <= targetDate) return 100;
        const overrunRatio = (actualDate.getTime() - targetDate.getTime()) / targetDate.getTime();
        return Math.max(0, 100 - Math.round(overrunRatio * 100));
      }

      // Fallback: exact string match
      return achievement.trim().toLowerCase() === target.trim().toLowerCase() ? 100 : 0;
    }

    default:
      return 0;
  }
};

/**
 * Clamped variant — always returns [0, 100].
 * Safe to use as CSS width / style={{ width: `${score}%` }}.
 */
export const calculateGoalProgress = (uomType, target, achievement) =>
  Math.min(calculateRawProgress(uomType, target, achievement), 100);

// Backward-compat aliases
export const calculateProgress = calculateGoalProgress;

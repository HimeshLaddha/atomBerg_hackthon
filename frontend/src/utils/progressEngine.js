/**
 * Calculates progress percentage based on Unit of Measurement (UoM).
 * Ensures progress is between 0 and 100.
 */
export const calculateProgress = (uomType, target, actual) => {
  if (!actual || actual.trim() === '') return 0;

  const targetNum = parseFloat(target);
  const actualNum = parseFloat(actual);

  if (isNaN(actualNum)) return 0; // fallback for non-numeric

  let progress = 0;

  switch (uomType) {
    case 'Numeric_Max':
    case 'Percentage_Max':
      // Higher is better. e.g. Target: 100, Actual: 50 -> 50%
      if (targetNum === 0) return actualNum > 0 ? 100 : 0;
      progress = (actualNum / targetNum) * 100;
      break;

    case 'Numeric_Min':
    case 'Percentage_Min':
      // Lower is better. e.g. Target: 50, Actual: 100 -> 50%
      if (actualNum === 0) return 100;
      progress = (targetNum / actualNum) * 100;
      break;

    case 'Zero-based':
      // Exactly 0 -> 100%, >0 -> 0%
      progress = actualNum === 0 ? 100 : 0;
      break;

    case 'Timeline':
      // Date comparison. Simplistic check: If actual date <= target date -> 100% else 0%
      // But typically we return 100 if completed on/before, or a simple 0/100 based on status
      const targetDate = new Date(target);
      const actualDate = new Date(actual);
      if (!isNaN(targetDate) && !isNaN(actualDate)) {
        progress = actualDate <= targetDate ? 100 : 0;
      } else {
        // Fallback for generic text like "Q1 End"
        progress = actual.toLowerCase() === target.toLowerCase() ? 100 : 0;
      }
      break;

    default:
      progress = 0;
  }

  // Cap between 0 and 100
  return Math.min(Math.max(Math.round(progress), 0), 100);
};

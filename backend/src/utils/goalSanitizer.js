/**
 * Sanitizes goals coming from the frontend before any DB write.
 * Ensures quarterlyAchievements is always a proper object (never a "" string).
 */
export const sanitizeGoals = (goals) => {
  if (!Array.isArray(goals)) return goals;
  const emptyQuarter = () => ({ actualAchievement: '', status: 'Not Started', managerComment: '' });

  return goals.map(goal => {
    const qa = goal.quarterlyAchievements || {};
    return {
      ...goal,
      quarterlyAchievements: {
        Q1: (qa.Q1 && typeof qa.Q1 === 'object') ? qa.Q1 : emptyQuarter(),
        Q2: (qa.Q2 && typeof qa.Q2 === 'object') ? qa.Q2 : emptyQuarter(),
        Q3: (qa.Q3 && typeof qa.Q3 === 'object') ? qa.Q3 : emptyQuarter(),
        Q4: (qa.Q4 && typeof qa.Q4 === 'object') ? qa.Q4 : emptyQuarter(),
      }
    };
  });
};

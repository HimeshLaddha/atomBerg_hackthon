export const exportToCSV = (data, filename = 'organization_data.csv') => {
  if (!data || !data.length) return;

  // Simple flatten approach assuming data is an array of GoalSheet documents
  // For the MVP, we will extract the top-level sheet info and map each goal to a row.
  
  const headers = [
    'Sheet ID', 'Cycle', 'Status', 'Employee Name', 'Department',
    'Goal Title', 'Thrust Area', 'UoM', 'Target', 'Weightage',
    'Q1 Actual', 'Q1 Status', 'Q2 Actual', 'Q2 Status',
    'Q3 Actual', 'Q3 Status', 'Q4 Actual', 'Q4 Status'
  ];

  const rows = [];
  rows.push(headers.join(','));

  data.forEach(sheet => {
    const empName = sheet.employeeId?.name || 'Unknown';
    const empDept = sheet.employeeId?.department || 'Unknown';
    
    sheet.goals.forEach(goal => {
      const q1 = goal.quarterlyAchievements?.Q1 || {};
      const q2 = goal.quarterlyAchievements?.Q2 || {};
      const q3 = goal.quarterlyAchievements?.Q3 || {};
      const q4 = goal.quarterlyAchievements?.Q4 || {};

      const row = [
        sheet._id,
        sheet.cycle,
        sheet.status,
        `"${empName}"`,
        `"${empDept}"`,
        `"${goal.title}"`,
        `"${goal.thrustArea}"`,
        goal.uomType,
        `"${goal.target}"`,
        goal.weightage,
        `"${q1.actualAchievement || ''}"`, q1.status || '',
        `"${q2.actualAchievement || ''}"`, q2.status || '',
        `"${q3.actualAchievement || ''}"`, q3.status || '',
        `"${q4.actualAchievement || ''}"`, q4.status || ''
      ];

      rows.push(row.join(','));
    });
  });

  const csvString = rows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

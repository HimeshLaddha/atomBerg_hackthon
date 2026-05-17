import { calculateGoalProgress } from './progressEngine';

/**
 * Prompt 2.2: Native Client-Side CSV Export Tool
 * Columns: Employee Name, Department, Goal Title, Thrust Area,
 *           Planned Target, Actual Achievement, Computed Progress Score
 */

const escapeCell = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

// Compute best overall actual across Q1–Q4 (pick latest non-empty)
const getLatestActual = (quarterlyAchievements) => {
  const quarters = ['Q4', 'Q3', 'Q2', 'Q1'];
  for (const q of quarters) {
    const actual = quarterlyAchievements?.[q]?.actualAchievement;
    if (actual && actual.trim() !== '') return actual;
  }
  return '';
};

export const exportAchievementReport = (sheets, filename = 'achievement_report.csv') => {
  if (!sheets || !sheets.length) {
    alert('No data to export.');
    return;
  }

  const headers = [
    'Employee Name',
    'Department',
    'Goal Title',
    'Thrust Area',
    'Planned Target',
    'UoM Type',
    'Weightage (%)',
    'Actual Achievement',
    'Computed Progress Score (%)',
    'Q1 Status',
    'Q2 Status',
    'Q3 Status',
    'Q4 Status'
  ];

  const rows = [headers.map(escapeCell).join(',')];

  sheets.forEach(sheet => {
    const empName = sheet.employeeId?.name ?? 'Unknown';
    const dept = sheet.employeeId?.department ?? 'Unknown';

    sheet.goals.forEach(goal => {
      const latestActual = getLatestActual(goal.quarterlyAchievements);
      const progressScore = latestActual
        ? calculateGoalProgress(goal.uomType, goal.target, latestActual)
        : 0;

      const row = [
        escapeCell(empName),
        escapeCell(dept),
        escapeCell(goal.title),
        escapeCell(goal.thrustArea),
        escapeCell(goal.target),
        escapeCell(goal.uomType),
        escapeCell(goal.weightage),
        escapeCell(latestActual),
        escapeCell(progressScore),
        escapeCell(goal.quarterlyAchievements?.Q1?.status ?? ''),
        escapeCell(goal.quarterlyAchievements?.Q2?.status ?? ''),
        escapeCell(goal.quarterlyAchievements?.Q3?.status ?? ''),
        escapeCell(goal.quarterlyAchievements?.Q4?.status ?? '')
      ];
      rows.push(row.join(','));
    });
  });

  const csvString = rows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Backward compat
export const exportToCSV = exportAchievementReport;

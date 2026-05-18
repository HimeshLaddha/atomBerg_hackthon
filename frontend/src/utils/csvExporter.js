import { calculateGoalProgress } from './progressEngine';

/**
 * csvExporter.js — Native client-side CSV generation utility.
 *
 * BRD-specified columns for exportMasterReport():
 *   Employee ID, Employee Name, Department, Thrust Area, Goal Title,
 *   Target, Quarter, Actual Achievement, Status, Manager Comments
 *
 * No server compute is consumed — the CSV blob is constructed entirely in
 * the browser and delivered via a hidden anchor click.
 */

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Wraps a value in double-quotes and escapes any internal double-quotes. */
const escapeCell = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

/** Triggers a browser file download from a plain-text CSV string. */
const triggerDownload = (csvString, filename) => {
  // Ensure filename ends with .csv
  const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  // Use correct MIME type for Excel with UTF-8
  const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = finalFilename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  
  // Defer cleanup to allow browser to register the download name
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
};

// ─── BRD-spec export: one row per (employee, goal, quarter) ──────────────────

/**
 * exportMasterReport
 *
 * Takes an array of populated GoalSheet documents (with employeeId populated)
 * and emits a CSV with the BRD-mandated column set.
 *
 * Row granularity: one row per (goal × quarter) combination.
 * This gives the full quarterly breakout needed for audit & performance review.
 *
 * @param {Array}  sheets   - Populated GoalSheet objects
 * @param {string} filename - Output filename (default: master_achievement_report.csv)
 */
export const exportMasterReport = (sheets, filename = 'master_achievement_report.csv') => {
  if (!sheets?.length) {
    alert('No approved data available to export.');
    return;
  }

  const HEADERS = [
    'Employee ID',
    'Employee Name',
    'Department',
    'Thrust Area',
    'Goal Title',
    'Target',
    'Quarter',
    'Actual Achievement',
    'Status',
    'Manager Comments',
  ];

  const rows = [HEADERS.map(escapeCell).join(',')];

  const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

  sheets.forEach(sheet => {
    const empId   = sheet.employeeId?.userId   ?? sheet.employeeId?._id ?? '—';
    const empName = sheet.employeeId?.name      ?? '—';
    const dept    = sheet.employeeId?.department ?? '—';

    sheet.goals.forEach(goal => {
      QUARTERS.forEach(quarter => {
        const qa     = goal.quarterlyAchievements?.[quarter] ?? {};
        const actual  = qa.actualAchievement ?? '';
        const status  = qa.status            ?? 'Not Started';
        const comment = qa.managerComment    ?? '';

        rows.push([
          escapeCell(empId),
          escapeCell(empName),
          escapeCell(dept),
          escapeCell(goal.thrustArea),
          escapeCell(goal.title),
          escapeCell(goal.target),
          escapeCell(quarter),
          escapeCell(actual),
          escapeCell(status),
          escapeCell(comment),
        ].join(','));
      });
    });
  });

  triggerDownload(rows.join('\n'), filename);
};

// ─── Legacy / extended export (kept for backward compat with AdminPanel) ──────

/**
 * exportAchievementReport
 *
 * Original richer export — one row per goal (latest Q across Q4→Q1),
 * includes UoM, Weightage, computed Progress Score, and per-Q statuses.
 * Retained so existing AdminPanel "Export Achievement Report" button keeps working.
 */
const getLatestActual = (quarterlyAchievements) => {
  for (const q of ['Q4', 'Q3', 'Q2', 'Q1']) {
    const val = quarterlyAchievements?.[q]?.actualAchievement;
    if (val && val.trim() !== '') return val;
  }
  return '';
};

export const exportAchievementReport = (sheets, filename = 'achievement_report.csv') => {
  if (!sheets?.length) {
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
    'Q4 Status',
  ];

  const rows = [headers.map(escapeCell).join(',')];

  sheets.forEach(sheet => {
    const empName = sheet.employeeId?.name       ?? 'Unknown';
    const dept    = sheet.employeeId?.department ?? 'Unknown';

    sheet.goals.forEach(goal => {
      const latestActual = getLatestActual(goal.quarterlyAchievements);
      const progressScore = latestActual
        ? calculateGoalProgress(goal.uomType, goal.target, latestActual)
        : 0;

      rows.push([
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
        escapeCell(goal.quarterlyAchievements?.Q4?.status ?? ''),
      ].join(','));
    });
  });

  triggerDownload(rows.join('\n'), filename);
};

// Alias for any existing imports
export const exportToCSV = exportAchievementReport;

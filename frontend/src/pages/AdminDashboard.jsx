import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SharedKpiForm from '../components/admin/SharedKpiForm';
import UserProvisioningForm from '../components/admin/UserProvisioningForm';
import { exportMasterReport } from '../utils/csvExporter';
import API from '../config/api';

// ── Small helpers ─────────────────────────────────────────────────────────────
const TabBtn = ({ id, active, onClick, children }) => (
  <button
    onClick={() => onClick(id)}
    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {children}
  </button>
);

const StatusPill = ({ status }) => {
  const map = {
    Approved:         'bg-green-100 text-green-700',
    Pending_Approval: 'bg-amber-100 text-amber-700',
    Draft:            'bg-gray-100 text-gray-600',
    'Not Started':    'bg-red-100 text-red-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
};

const ProgressBar = ({ pct, color = 'bg-indigo-500' }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-[60px]">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
    <span className="text-xs font-bold text-gray-600 w-8 text-right">{pct}%</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: Completion Tracker Board
// ─────────────────────────────────────────────────────────────────────────────
const CompletionTrackerTab = () => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // /approved returns all org-wide approved GoalSheets with populated employeeId
      const res = await axios.get(`${API}/api/goals/approved`);
      setSheets(res.data ?? []);
    } catch (e) {
      console.error('CompletionTracker load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="py-16 text-center text-gray-400 text-sm">Loading completion data…</div>;

  // Compute per-sheet Q1–Q4 completion metrics
  const rows = sheets.map(sheet => {
    const total = sheet.goals.length;
    const qStats = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
      const done = sheet.goals.filter(g => g.quarterlyAchievements?.[q]?.status === 'Completed').length;
      const hasComment = sheet.goals.some(g => g.quarterlyAchievements?.[q]?.managerComment?.trim());
      return { q, done, hasComment, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
    });

    const overallPct = total > 0
      ? Math.round(qStats.reduce((s, x) => s + x.done, 0) / (total * 4) * 100)
      : 0;

    const allQsDone = qStats.every(x => x.done === total);
    const allCheckedIn = qStats.every(x => x.hasComment);

    return { sheet, total, qStats, overallPct, allQsDone, allCheckedIn };
  });

  // Summary KPI cards
  const totalEmployees = rows.length;
  const submissionComplete = rows.filter(r => r.sheet.status === 'Approved').length;
  const checkInComplete = rows.filter(r => r.allCheckedIn).length;
  const fullyDone = rows.filter(r => r.allQsDone).length;

  return (
    <div className="space-y-6">
      {/* KPI summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Approved Sheets',     value: totalEmployees,      color: 'text-indigo-600' },
          { label: 'Goal Submission Complete',  value: submissionComplete,  color: 'text-green-600'  },
          { label: 'Manager Check-in Complete', value: checkInComplete,     color: 'text-blue-600'   },
          { label: 'Full Q1–Q4 Cycle Complete', value: fullyDone,           color: 'text-violet-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1 leading-tight">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Per-employee tracker grid */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-3">Employee Progress Tracker</h2>
        <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Employee', 'Dept', 'Goals', 'Sheet Status', 'Q1', 'Q2', 'Q3', 'Q4', 'Check-in', 'Overall'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(({ sheet, total, qStats, overallPct, allCheckedIn }) => (
                <tr key={sheet._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">
                    {sheet.employeeId?.name}
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {sheet.employeeId?.department}
                  </td>
                  <td className="px-3 py-3 text-gray-600 font-bold">{total}</td>
                  <td className="px-3 py-3">
                    <StatusPill status={sheet.status} />
                  </td>
                  {qStats.map(({ q, done, pct }) => (
                    <td key={q} className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-bold ${pct === 100 ? 'text-green-600' : pct > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          {done}/{total}
                        </span>
                        <ProgressBar
                          pct={pct}
                          color={pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-gray-200'}
                        />
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      allCheckedIn ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {allCheckedIn ? '✓ Done' : '⏳ Pending'}
                    </span>
                  </td>
                  <td className="px-3 py-3 min-w-[100px]">
                    <ProgressBar
                      pct={overallPct}
                      color={overallPct === 100 ? 'bg-green-500' : overallPct > 50 ? 'bg-indigo-500' : 'bg-amber-500'}
                    />
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan="10" className="py-10 text-center text-gray-400 text-sm">
                    No approved goal sheets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: Audit Trail Explorer
// ─────────────────────────────────────────────────────────────────────────────
const AuditTrailTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    axios.get(`${API}/api/goals/audit`)
      .then(r => setLogs(r.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 text-center text-gray-400 text-sm">Loading audit trail…</div>;

  // Flatten logs → one row per field-delta
  const rows = logs.flatMap(log =>
    (log.changes ?? []).map((c, ci) => ({
      key: `${log._id}-${ci}`,
      timestamp: new Date(log.timestamp),
      who: log.changedBy?.name ?? '—',
      whoRole: log.changedBy?.role ?? '',
      field: c.field,
      oldValue: c.oldValue,
      newValue: c.newValue,
    }))
  );

  const filtered = filter
    ? rows.filter(r =>
        r.who.toLowerCase().includes(filter.toLowerCase()) ||
        r.field.toLowerCase().includes(filter.toLowerCase())
      )
    : rows;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-800">Post-Lock Audit Trail Explorer</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} change record{filtered.length !== 1 ? 's' : ''} logged
          </p>
        </div>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by person or field…"
          className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
        />
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-slate-900 bg-slate-900/50 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <table className="min-w-full divide-y divide-slate-800 bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Timestamp', 'Changed By', 'Role', 'Field Altered', 'Old Value', 'New Value'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(row => (
              <tr key={row.key} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {row.timestamp.toLocaleDateString()} {row.timestamp.toLocaleTimeString()}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{row.who}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                    {row.whoRole}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-blue-700 max-w-[200px] truncate" title={row.field}>
                  {row.field}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-red-500 max-w-[120px] truncate" title={String(row.oldValue ?? '—')}>
                  {String(row.oldValue ?? '—')}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-green-600 max-w-[120px] truncate" title={String(row.newValue ?? '—')}>
                  {String(row.newValue ?? '—')}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan="6" className="py-10 text-center text-gray-400 text-sm">
                  {filter ? 'No matching records found.' : 'No audit entries yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: Master CSV Report Exporter
// ─────────────────────────────────────────────────────────────────────────────
const ReportExporterTab = () => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/goals/approved`)
      .then(r => setSheets(r.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    setExporting(true);
    try {
      exportMasterReport(sheets);
    } finally {
      setTimeout(() => setExporting(false), 800);
    }
  };

  if (loading) return <div className="py-16 text-center text-gray-400 text-sm">Loading report data…</div>;

  // Preview summary rows
  const previewRows = sheets.flatMap(sheet =>
    ['Q1', 'Q2', 'Q3', 'Q4'].flatMap(q =>
      sheet.goals.map(g => ({
        empId:   sheet.employeeId?.userId ?? '—',
        empName: sheet.employeeId?.name ?? '—',
        dept:    sheet.employeeId?.department ?? '—',
        thrust:  g.thrustArea,
        title:   g.title,
        target:  g.target,
        quarter: q,
        actual:  g.quarterlyAchievements?.[q]?.actualAchievement ?? '',
        status:  g.quarterlyAchievements?.[q]?.status ?? 'Not Started',
        comment: g.quarterlyAchievements?.[q]?.managerComment ?? '',
      }))
    )
  );

  return (
    <div className="space-y-6">
      {/* Export header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-800">Master Achievement Report</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {sheets.length} approved sheets · {previewRows.length} total rows
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !sheets.length}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white font-medium tracking-wide text-xs sm:text-sm rounded-lg
            hover:bg-green-700 disabled:opacity-50 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        >
          {exporting ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          Export Master Achievement Report (CSV)
        </button>
      </div>

      {/* Column preview */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wider">CSV Columns Included</p>
        <div className="flex flex-wrap gap-2">
          {[
            'Employee ID', 'Employee Name', 'Department',
            'Thrust Area', 'Goal Title', 'Target',
            'Quarter', 'Actual Achievement', 'Status', 'Manager Comments',
          ].map(col => (
            <span key={col} className="px-2 py-0.5 bg-white border border-blue-200 rounded text-xs font-mono text-blue-700">
              {col}
            </span>
          ))}
        </div>
      </div>

      {/* Data preview table (first 10 rows) */}
      {previewRows.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Data Preview — First {Math.min(previewRows.length, 10)} rows
          </p>
          <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <table className="min-w-full divide-y divide-slate-800 bg-white text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {['Emp ID', 'Name', 'Dept', 'Thrust Area', 'Goal Title', 'Target', 'Q', 'Actual', 'Status', 'Comment'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previewRows.slice(0, 10).map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-gray-600">{r.empId}</td>
                    <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap">{r.empName}</td>
                    <td className="px-3 py-2 text-gray-500">{r.dept}</td>
                    <td className="px-3 py-2 text-gray-600">{r.thrust}</td>
                    <td className="px-3 py-2 text-gray-800 max-w-[120px] truncate" title={r.title}>{r.title}</td>
                    <td className="px-3 py-2 text-indigo-600 font-bold">{r.target}</td>
                    <td className="px-3 py-2 font-bold text-gray-700">{r.quarter}</td>
                    <td className="px-3 py-2 text-gray-500">{r.actual || '—'}</td>
                    <td className="px-3 py-2"><StatusPill status={r.status} /></td>
                    <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate" title={r.comment}>{r.comment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewRows.length > 10 && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              … and {previewRows.length - 10} more rows in the full export
            </p>
          )}
        </div>
      )}

      {!sheets.length && (
        <div className="py-16 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm font-medium">No approved sheets available for export.</p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: AdminDashboard
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'tracker', label: '📊 Completion Tracker' },
  { id: 'audit',   label: '🔍 Audit Trail'        },
  { id: 'report',  label: '📥 CSV Export'          },
  { id: 'kpi',     label: '📡 Inject Shared KPI'   },
  { id: 'provisioning', label: '👤 User Provisioning' },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('tracker');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-gray-800">Admin Governance Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-0.5">
              Completion tracking, audit explorer, CSV reporting, and KPI injection.
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(t => (
          <TabBtn key={t.id} id={t.id} active={activeTab === t.id} onClick={setActiveTab}>
            {t.label}
          </TabBtn>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'tracker' && <CompletionTrackerTab />}
      {activeTab === 'audit'   && <AuditTrailTab />}
      {activeTab === 'report'  && <ReportExporterTab />}
      {activeTab === 'kpi'     && <SharedKpiForm />}
      {activeTab === 'provisioning' && <UserProvisioningForm />}
    </div>
  );
};

export default AdminDashboard;

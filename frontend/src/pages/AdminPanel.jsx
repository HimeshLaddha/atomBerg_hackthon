import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { exportAchievementReport } from '../utils/csvExporter';
import { calculateGoalProgress } from '../utils/progressEngine';
import SharedKpiForm from '../components/admin/SharedKpiForm';

const UOM_TYPES = ['Numeric_Min', 'Percentage_Min', 'Numeric_Max', 'Percentage_Max', 'Zero-based', 'Timeline'];
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Human Resources'];

const ESCALATION_WINDOWS = [
  { label: '1 Day Past Due', days: 1 },
  { label: '3 Days Past Due', days: 3 },
  { label: '5 Days Past Due', days: 5 },
  { label: '10 Days Past Due', days: 10 },
  { label: '15 Days Past Due', days: 15 },
];

const TabBtn = ({ id, active, onClick, children }) => (
  <button
    onClick={() => onClick(id)}
    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
      active ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {children}
  </button>
);

// SharedKPITab now delegates to the standalone SharedKpiForm component
const SharedKPITab = () => <SharedKpiForm />;

// ─── ACHIEVEMENT MATRIX + CSV EXPORT ─────────────────────────────────────────
const MatrixTab = () => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/goals/approved')
      .then(r => setSheets(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading organization matrix...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Organization Execution Matrix</h2>
          <p className="text-xs text-gray-500 mt-0.5">{sheets.length} approved goal sheets across the organization</p>
        </div>
        <button onClick={() => exportAchievementReport(sheets)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-bold text-sm rounded-lg hover:bg-green-700 shadow-sm">
          <span>↓</span><span>Export Achievement Report</span>
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Employee', 'Department', 'Goals', 'Completed Q1', 'Completed Q2', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sheets.map(sheet => {
              const completedQ1 = sheet.goals.filter(g => g.quarterlyAchievements?.Q1?.status === 'Completed').length;
              const completedQ2 = sheet.goals.filter(g => g.quarterlyAchievements?.Q2?.status === 'Completed').length;
              return (
                <tr key={sheet._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{sheet.employeeId?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{sheet.employeeId?.department}</td>
                  <td className="px-4 py-3 text-gray-500">{sheet.goals.length}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${completedQ1 === sheet.goals.length ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {completedQ1}/{sheet.goals.length}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${completedQ2 === sheet.goals.length ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {completedQ2}/{sheet.goals.length}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Approved</span></td>
                </tr>
              );
            })}
            {!sheets.length && <tr><td colSpan="6" className="py-8 text-center text-gray-400 text-sm">No approved sheets found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── ESCALATION LOG TRACKER ───────────────────────────────────────────────────
const MOCK_TEAM = [
  { id: 'EMP-003', name: 'Charlie Employee', role: 'Employee', manager: 'Bob Manager', sheetStatus: 'Draft', lastActivity: null },
  { id: 'EMP-002', name: 'Bob Manager', role: 'Manager', manager: 'Alice Admin', pendingApprovals: 2, lastApproval: null },
];

const EscalationTab = () => {
  const [window, setWindow] = useState('');
  const [flags, setFlags] = useState([]);

  const runSimulation = (days) => {
    const results = [];
    MOCK_TEAM.forEach(member => {
      if (member.role === 'Employee' && (member.sheetStatus === 'Draft' || !member.sheetStatus)) {
        results.push({
          severity: days >= 5 ? 'critical' : 'warning',
          employee: member.name,
          manager: member.manager,
          type: 'Goal Sheet Not Submitted',
          detail: `No submission after ${days} day${days > 1 ? 's' : ''} — sheet status: ${member.sheetStatus || 'Not Started'}`,
          trace: ['Employee Warning', 'L1 Manager Alert', days >= 10 ? 'Skip-Level HR Escalation' : null].filter(Boolean)
        });
      }
      if (member.role === 'Manager' && member.pendingApprovals > 0 && days >= 3) {
        results.push({
          severity: days >= 10 ? 'critical' : 'warning',
          employee: member.name,
          manager: 'Alice Admin (HR)',
          type: 'Pending Approvals Threshold Exceeded',
          detail: `${member.pendingApprovals} pending approval(s) unresolved after ${days} days`,
          trace: ['L1 Manager Alert', 'Skip-Level HR Escalation']
        });
      }
    });
    setFlags(results);
  };

  const severityStyle = (s) => s === 'critical'
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-amber-50 border-amber-200 text-amber-800';

  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Simulate Timeline Window Delay</label>
          <select value={window} onChange={e => { setWindow(e.target.value); runSimulation(parseInt(e.target.value)); }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">— Select window to simulate —</option>
            {ESCALATION_WINDOWS.map(w => <option key={w.days} value={w.days}>{w.label}</option>)}
          </select>
        </div>
        {flags.length > 0 && (
          <div className="mt-5 px-4 py-2 bg-red-100 text-red-700 text-sm font-bold rounded-lg border border-red-200">
            ⚠ {flags.length} escalation{flags.length > 1 ? 's' : ''} flagged
          </div>
        )}
      </div>

      {!window && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm font-medium">Select a timeline window above to run the escalation scan</p>
        </div>
      )}

      {window && flags.length === 0 && (
        <div className="text-center py-16 bg-green-50 rounded-xl border border-green-100 text-green-600">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-sm font-medium">No escalations detected for this window.</p>
        </div>
      )}

      <div className="space-y-4">
        {flags.map((flag, i) => (
          <div key={i} className={`border rounded-xl p-5 ${severityStyle(flag.severity)}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className={`inline-block px-2 py-0.5 text-xs font-black rounded uppercase mr-2 ${flag.severity === 'critical' ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'}`}>
                  {flag.severity}
                </span>
                <span className="font-bold text-sm">{flag.type}</span>
              </div>
            </div>
            <p className="text-sm mb-1"><span className="font-semibold">Person:</span> {flag.employee}</p>
            <p className="text-sm mb-3"><span className="font-semibold">Detail:</span> {flag.detail}</p>
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              {flag.trace.map((step, si) => (
                <React.Fragment key={si}>
                  <span className="px-3 py-1 text-xs font-bold bg-white/60 rounded-full border border-current/20">{step}</span>
                  {si < flag.trace.length - 1 && <span className="text-current opacity-50">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── ANALYTICS: GOAL DISTRIBUTION + MANAGER EFFECTIVENESS ───────────────────
const AnalyticsTab = () => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/goals/approved')
      .then(r => setSheets(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading analytics...</div>;

  // Goal Distribution by Thrust Area
  const thrustMap = {};
  const uomMap = {};
  sheets.forEach(sheet => {
    sheet.goals.forEach(g => {
      thrustMap[g.thrustArea] = (thrustMap[g.thrustArea] || 0) + 1;
      uomMap[g.uomType] = (uomMap[g.uomType] || 0) + 1;
    });
  });
  const totalGoals = Object.values(thrustMap).reduce((a, b) => a + b, 0);

  // Manager Effectiveness: group sheets by managerId (from employeeId.managerId)
  // For MVP, we track check-in completion by looking at Q1 managerComments
  const managerMap = {};
  sheets.forEach(sheet => {
    const managerName = 'Bob Manager'; // In MVP, single manager
    if (!managerMap[managerName]) managerMap[managerName] = { total: 0, checkedIn: 0, pending: 0 };
    managerMap[managerName].total += 1;
    const hasCheckin = sheet.goals.some(g => g.quarterlyAchievements?.Q1?.managerComment);
    if (hasCheckin) managerMap[managerName].checkedIn += 1;
    else managerMap[managerName].pending += 1;
  });

  return (
    <div className="space-y-8">
      {/* Goal Distribution Summary */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Goal Distribution Breakdown</h2>
        <div className="grid grid-cols-2 gap-6">
          {/* By Thrust Area */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">By Thrust Area</h3>
            {Object.keys(thrustMap).length === 0 ? (
              <p className="text-sm text-gray-400">No data</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(thrustMap).sort((a, b) => b[1] - a[1]).map(([area, count]) => {
                  const pct = totalGoals > 0 ? Math.round((count / totalGoals) * 100) : 0;
                  return (
                    <div key={area}>
                      <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                        <span>{area}</span><span>{count} goals ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* By UoM */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">By UoM Category</h3>
            {Object.keys(uomMap).length === 0 ? (
              <p className="text-sm text-gray-400">No data</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(uomMap).map(([uom, count]) => (
                  <div key={uom} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 truncate">{uom.replace('_', ' ')}</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">{count}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manager Effectiveness Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Manager Effectiveness Ranking</h2>
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Manager', 'Team Size', 'Check-ins Done', 'Outstanding', 'Completion Rate', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(managerMap).map(([mgr, data]) => {
                const rate = data.total > 0 ? Math.round((data.checkedIn / data.total) * 100) : 0;
                return (
                  <tr key={mgr} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{mgr}</td>
                    <td className="px-4 py-3 text-gray-500">{data.total}</td>
                    <td className="px-4 py-3 text-green-600 font-bold">{data.checkedIn}</td>
                    <td className="px-4 py-3 text-amber-600 font-bold">{data.pending}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 w-24">
                          <div className={`h-2 rounded-full ${rate === 100 ? 'bg-green-500' : rate > 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${rate}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-gray-600">{rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${rate === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {rate === 100 ? '✓ Complete' : '⏳ In Progress'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!Object.keys(managerMap).length && (
                <tr><td colSpan="6" className="py-8 text-center text-gray-400 text-sm">No manager data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── AUDIT TRAIL ─────────────────────────────────────────────────────────────
const AuditTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/goals/audit')
      .then(r => setLogs(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading audit trail...</div>;

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">Post-Lock Modification Audit Trail</h2>
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Timestamp', 'Changed By', 'Field Altered', 'Old Value', 'New Value'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.flatMap(log =>
              log.changes.map((c, i) => (
                <tr key={`${log._id}-${i}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{log.changedBy?.name} <span className="text-xs text-gray-400">({log.changedBy?.role})</span></td>
                  <td className="px-4 py-3 text-blue-600 font-mono text-xs max-w-xs truncate">{c.field}</td>
                  <td className="px-4 py-3 text-red-500 font-mono text-xs max-w-xs truncate">{String(c.oldValue ?? '—')}</td>
                  <td className="px-4 py-3 text-green-600 font-mono text-xs max-w-xs truncate">{String(c.newValue ?? '—')}</td>
                </tr>
              ))
            )}
            {!logs.length && <tr><td colSpan="5" className="py-8 text-center text-gray-400 text-sm">No modifications logged yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── MAIN ADMIN PANEL ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'kpi', label: '📡 Shared KPI' },
  { id: 'matrix', label: '📊 Execution Matrix' },
  { id: 'escalation', label: '⚠ Escalation Tracker' },
  { id: 'analytics', label: '📈 Analytics' },
  { id: 'audit', label: '🔍 Audit Trail' },
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('kpi');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Admin Governance Panel</h1>
        <p className="text-gray-500 mt-1">Broadcast KPIs, monitor execution, track escalations, and export reports.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(t => <TabBtn key={t.id} id={t.id} active={activeTab === t.id} onClick={setActiveTab}>{t.label}</TabBtn>)}
      </div>

      {activeTab === 'kpi'        && <SharedKPITab />}
      {activeTab === 'matrix'    && <MatrixTab />}
      {activeTab === 'escalation' && <EscalationTab />}
      {activeTab === 'analytics'  && <AnalyticsTab />}
      {activeTab === 'audit'      && <AuditTab />}
    </div>
  );
};

export default AdminPanel;

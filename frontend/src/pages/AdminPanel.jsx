import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { exportAchievementReport, exportAuditTrail } from '../utils/csvExporter';
import { calculateGoalProgress } from '../utils/progressEngine';
import SharedKpiForm from '../components/admin/SharedKpiForm';
import EscalationEngine from '../components/admin/EscalationEngine';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import API from '../config/api';

const UOM_TYPES = ['Numeric_Min', 'Percentage_Min', 'Numeric_Max', 'Percentage_Max', 'Zero-based', 'Timeline'];
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Human Resources'];

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
    axios.get(`${API}/api/goals/approved`)
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

// ─── ESCALATION ENGINE (Section 5.3) — delegated to modular component ────────
const EscalationTab = () => <EscalationEngine />;

// ─── ANALYTICS DASHBOARD (Section 5.4) — delegated to modular component ──────
const AnalyticsTab = () => <AnalyticsDashboard />;

// ─── AUDIT TRAIL ─────────────────────────────────────────────────────────────
const AuditTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/goals/audit`)
      .then(r => setLogs(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading audit trail...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Post-Lock Modification Audit Trail</h2>
        <button onClick={() => exportAuditTrail(logs)}
          className="flex items-center space-x-2 px-4 py-2 bg-white text-indigo-600 border-2 border-indigo-200 font-bold text-sm rounded-lg hover:bg-indigo-50 shadow-sm transition-colors">
          <span>↓</span><span>Export Immutable Audit Trail (CSV)</span>
        </button>
      </div>
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
  { id: 'kpi',        label: '📡 Shared KPI'           },
  { id: 'matrix',     label: '📊 Execution Matrix'      },
  { id: 'escalation', label: '🚨 Escalation Engine'     },
  { id: 'analytics',  label: '📈 QoQ Analytics'         },
  { id: 'audit',      label: '🔍 Audit Trail'           },
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

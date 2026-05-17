import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { exportToCSV } from '../utils/csvExporter';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('kpi'); // 'kpi' | 'matrix' | 'audit'
  
  // KPI Form State
  const [kpiForm, setKpiForm] = useState({ title: '', thrustArea: '', uomType: 'Numeric_Min', target: '', department: 'Engineering' });
  const [kpiMessage, setKpiMessage] = useState('');
  const [isPushing, setIsPushing] = useState(false);

  // Matrix State
  const [sheets, setSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);

  // Audit State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchSheets = async () => {
    setLoadingSheets(true);
    try {
      const res = await axios.get('http://localhost:5000/api/goals/approved');
      setSheets(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSheets(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await axios.get('http://localhost:5000/api/goals/audit');
      setAuditLogs(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'matrix') fetchSheets();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  const handlePushKPI = async (e) => {
    e.preventDefault();
    setIsPushing(true);
    setKpiMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/goals/shared-kpi', kpiForm);
      setKpiMessage(res.data.message);
      setKpiForm({ title: '', thrustArea: '', uomType: 'Numeric_Min', target: '', department: 'Engineering' });
    } catch (error) {
      setKpiMessage(error.response?.data?.message || 'Failed to push KPI');
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Admin Governance Panel</h1>
        <p className="text-gray-500 mt-1">Manage shared KPIs, monitor execution matrix, and audit logs.</p>
      </div>

      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab('kpi')}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            activeTab === 'kpi' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Shared KPI Distributor
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Completion Matrix
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Audit Trail
        </button>
      </div>

      {/* Feature A: Shared KPI Distributor */}
      {activeTab === 'kpi' && (
        <div className="max-w-2xl bg-gray-50 border border-gray-200 p-6 rounded-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Push Shared KPI to Department</h2>
          <form onSubmit={handlePushKPI} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Target Department</label>
                <select 
                  value={kpiForm.department} 
                  onChange={e => setKpiForm({...kpiForm, department: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Thrust Area</label>
                <input required type="text" value={kpiForm.thrustArea} onChange={e => setKpiForm({...kpiForm, thrustArea: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Goal Title</label>
                <input required type="text" value={kpiForm.title} onChange={e => setKpiForm({...kpiForm, title: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Unit of Measurement</label>
                <select value={kpiForm.uomType} onChange={e => setKpiForm({...kpiForm, uomType: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                  {['Numeric_Min', 'Percentage_Min', 'Numeric_Max', 'Percentage_Max', 'Zero-based', 'Timeline'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Expected Target</label>
                <input required type="text" value={kpiForm.target} onChange={e => setKpiForm({...kpiForm, target: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>
            <button type="submit" disabled={isPushing} className="w-full mt-4 bg-indigo-600 text-white font-bold py-2 rounded shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
              {isPushing ? 'Broadcasting...' : 'Broadcast KPI'}
            </button>
            {kpiMessage && <p className="mt-2 text-sm font-medium text-center text-indigo-700">{kpiMessage}</p>}
          </form>
        </div>
      )}

      {/* Feature B: Completion Matrix & CSV */}
      {activeTab === 'matrix' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Organization Execution Matrix</h2>
            <button 
              onClick={() => exportToCSV(sheets)} 
              className="px-4 py-2 bg-green-600 text-white font-bold text-sm rounded shadow flex items-center hover:bg-green-700"
            >
              ↓ Export to CSV
            </button>
          </div>
          
          {loadingSheets ? <p className="text-gray-500">Loading matrix...</p> : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total Goals</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sheets.map(sheet => (
                    <tr key={sheet._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{sheet.employeeId?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{sheet.employeeId?.department || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{sheet.goals.length}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Approved</span>
                      </td>
                    </tr>
                  ))}
                  {sheets.length === 0 && (
                    <tr><td colSpan="4" className="px-4 py-6 text-center text-gray-500 text-sm">No approved sheets found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Feature C: Audit Trail */}
      {activeTab === 'audit' && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Post-Lock Modification Audit Trail</h2>
          {loadingAudit ? <p className="text-gray-500">Loading audit logs...</p> : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Field Altered</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Old Value</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">New Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {auditLogs.flatMap(log => 
                    log.changes.map((change, idx) => (
                      <tr key={`${log._id}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{log.changedBy?.name} ({log.changedBy?.role})</td>
                        <td className="px-4 py-3 text-indigo-600 font-mono text-xs">{change.field}</td>
                        <td className="px-4 py-3 text-red-600 font-mono text-xs max-w-xs truncate">{change.oldValue || 'null'}</td>
                        <td className="px-4 py-3 text-green-600 font-mono text-xs max-w-xs truncate">{change.newValue || 'null'}</td>
                      </tr>
                    ))
                  )}
                  {auditLogs.length === 0 && (
                    <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500 text-sm">No modifications logged yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

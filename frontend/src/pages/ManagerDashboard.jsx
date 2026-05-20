import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import axios from 'axios';
import ManagerReview from './ManagerReview';
import ManagerTrackingReview from './ManagerTrackingReview';
import API from '../config/api';

const STATUS_BADGE = {
  'Not Started': 'bg-gray-100 text-gray-600',
  'Draft':       'bg-amber-100 text-amber-700',
  'Pending_Approval': 'bg-yellow-100 text-yellow-800',
  'Approved':    'bg-green-100 text-green-700',
};

const ManagerDashboard = () => {
  const { activeUser } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('phase1');
  const [subordinates, setSubordinates] = useState([]);   // all direct reports with status
  const [pendingSheets, setPendingSheets] = useState([]);  // full GoalSheet docs (Pending_Approval)
  const [approvedSheets, setApprovedSheets] = useState([]); // full GoalSheet docs (Approved)
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setSelectedSheet(null);
    try {
      const [subRes, pendingRes, approvedRes] = await Promise.all([
        axios.get(`${API}/api/goals/team/subordinates?managerId=${activeUser.userId}`),
        axios.get(`${API}/api/goals/pending?managerId=${activeUser.userId}`),
        axios.get(`${API}/api/goals/team-approved?managerId=${activeUser.userId}`)
      ]);
      setSubordinates(subRes.data || []);
      setPendingSheets(pendingRes.data || []);
      setApprovedSheets(approvedRes.data || []);
    } catch (err) {
      console.error('Manager fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [activeUser.userId]);

  // Find full sheet doc for a given subordinate
  const getSheetForSub = (sub) => {
    if (activeTab === 'phase1') {
      return pendingSheets.find(s => s.employeeId?._id === sub._id || s.employeeId === sub._id) || null;
    }
    return approvedSheets.find(s => s.employeeId?._id === sub._id || s.employeeId === sub._id) || null;
  };

  if (selectedSheet) {
    if (activeTab === 'phase1') {
      return (
        <ManagerReview
          sheet={selectedSheet}
          onBack={() => setSelectedSheet(null)}
          onActionComplete={() => { setSelectedSheet(null); fetchAll(); }}
        />
      );
    }
    return (
      <ManagerTrackingReview
        sheet={selectedSheet}
        onBack={() => setSelectedSheet(null)}
        onActionComplete={fetchAll}
      />
    );
  }

  const pendingCount = pendingSheets.length;
  const approvedCount = approvedSheets.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-gray-800">Team Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-1">
            {subordinates.length} direct report{subordinates.length !== 1 ? 's' : ''} · {activeUser.name}
          </p>
        </div>
        <button onClick={fetchAll} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Phase Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <button
          onClick={() => setActiveTab('phase1')}
          className={`w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium tracking-wide rounded-lg transition-all duration-200 ${
            activeTab === 'phase1' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Phase 1: Goal Approvals
          {pendingCount > 0 && (
            <span className={`ml-2 px-2 py-0.5 text-xs font-black rounded-full ${activeTab === 'phase1' ? 'bg-white text-indigo-600' : 'bg-yellow-400 text-white'}`}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('phase2')}
          className={`w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium tracking-wide rounded-lg transition-all duration-200 ${
            activeTab === 'phase2' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Phase 2: Quarterly Check-ins
          {approvedCount > 0 && (
            <span className={`ml-2 px-2 py-0.5 text-xs font-black rounded-full ${activeTab === 'phase2' ? 'bg-white text-indigo-600' : 'bg-green-500 text-white'}`}>
              {approvedCount}
            </span>
          )}
        </button>
      </div>

      {/* Tabular Directory Layout */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading team data...</div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <table className="min-w-full divide-y divide-gray-200 text-sm bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Name</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sheet Status</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Goals</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subordinates.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-400">No direct reports found for this manager.</td>
                </tr>
              )}
              {subordinates.map(sub => {
                const sheet = getSheetForSub(sub);
                const status = sub.goalSheetStatus || 'Not Started';
                const canAction = activeTab === 'phase1'
                  ? status === 'Pending_Approval'
                  : status === 'Approved';

                return (
                  <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                          {sub.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{sub.name}</p>
                          <p className="text-xs text-gray-400">{sub.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{sub.department}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'}`}>
                        {status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {sheet ? `${sheet.goals.length} goals` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {canAction && sheet ? (
                        <button
                          onClick={() => setSelectedSheet(sheet)}
                          className={`w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium tracking-wide rounded-lg transition-all duration-200 ${
                            activeTab === 'phase1'
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {activeTab === 'phase1' ? 'Review & Approve' : 'Start Check-in'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          {status === 'Not Started' ? 'Not submitted' :
                           status === 'Draft' ? 'Still drafting' :
                           activeTab === 'phase1' && status === 'Approved' ? 'Already approved' :
                           activeTab === 'phase2' && status === 'Pending_Approval' ? 'Not approved yet' :
                           '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;

import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import axios from 'axios';
import ManagerReview from './ManagerReview';
import ManagerTrackingReview from './ManagerTrackingReview';

const ManagerDashboard = () => {
  const { activeUser } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('phase1'); // 'phase1' | 'phase2'
  const [sheets, setSheets] = useState({ pending: [], approved: [] });
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState(null);

  const fetchSheets = async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/goals/pending?managerId=${activeUser.userId}`),
        axios.get(`http://localhost:5000/api/goals/team-approved?managerId=${activeUser.userId}`)
      ]);
      setSheets({
        pending: pendingRes.data || [],
        approved: approvedRes.data || []
      });
    } catch (error) {
      console.error('Failed to fetch sheets', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
    setSelectedSheet(null);
  }, [activeUser.userId]);

  if (selectedSheet) {
    if (activeTab === 'phase1') {
      return (
        <ManagerReview 
          sheet={selectedSheet} 
          onBack={() => setSelectedSheet(null)} 
          onActionComplete={() => {
            setSelectedSheet(null);
            fetchSheets();
          }}
        />
      );
    } else {
      return (
        <ManagerTrackingReview 
          sheet={selectedSheet} 
          onBack={() => setSelectedSheet(null)} 
          onActionComplete={() => {
            fetchSheets(); // refresh data
          }}
        />
      );
    }
  }

  const currentSheets = activeTab === 'phase1' ? sheets.pending : sheets.approved;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Team Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage approvals and quarterly milestones.</p>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('phase1')}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            activeTab === 'phase1'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Phase 1: Goal Approvals ({sheets.pending.length})
        </button>
        <button
          onClick={() => setActiveTab('phase2')}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
            activeTab === 'phase2'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Phase 2: Quarterly Check-ins ({sheets.approved.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading goal sheets...</div>
      ) : currentSheets.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          No goal sheets found for this phase.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currentSheets.map(sheet => (
            <div 
              key={sheet._id} 
              className="border border-gray-200 rounded-lg p-5 hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all bg-white relative group"
              onClick={() => setSelectedSheet(sheet)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">{sheet.employeeId.name}</h3>
                  <p className="text-xs text-gray-500">{sheet.employeeId.department}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${activeTab === 'phase1' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                  {activeTab === 'phase1' ? 'Pending' : 'Locked & Approved'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p><span className="font-medium text-gray-700">Cycle:</span> {sheet.cycle}</p>
                <p><span className="font-medium text-gray-700">Total Goals:</span> {sheet.goals.length}</p>
              </div>
              <button className={`w-full py-2 font-medium rounded-md transition-colors text-sm ${activeTab === 'phase1' ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                {activeTab === 'phase1' ? 'Review Goals' : 'Start Check-in'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;

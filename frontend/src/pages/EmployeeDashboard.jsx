import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import axios from 'axios';
import EmployeeGoalForm from './EmployeeGoalForm';
import EmployeeTracking from './EmployeeTracking';

const EmployeeDashboard = () => {
  const { activeUser } = useContext(UserContext);
  const [sheetData, setSheetData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardState = async (userId) => {
    // Step 1: WIPE state completely before any re-fetch
    setSheetData(null);
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/goals?userId=${userId}`);
      // { exists: false } → no sheet → null  
      if (res.data && res.data.exists !== false) {
        setSheetData(res.data);
      } else {
        setSheetData(null);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard state', error);
      setSheetData(null);
    } finally {
      setLoading(false);
    }
  };

  // Key requirement: userId in dependency array ensures a full wipe + re-fetch
  // every time the role switcher toggles to a different Employee profile
  useEffect(() => {
    if (activeUser?.userId) {
      fetchDashboardState(activeUser.userId);
    }
  }, [activeUser?.userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-24 space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 font-medium">Loading workspace for {activeUser?.name}...</p>
      </div>
    );
  }

  // No sheet exists → Phase 1: Goal Formulation Engine
  if (!sheetData) {
    return <EmployeeGoalForm onSuccess={() => fetchDashboardState(activeUser.userId)} />;
  }

  // Sheet exists in Draft state → show editable form with existing data
  if (sheetData.status === 'Draft') {
    return (
      <div>
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Draft in Progress</p>
            <p className="text-xs text-amber-600">Your goals are saved. Review, make changes, then submit for manager approval.</p>
          </div>
        </div>
        <EmployeeGoalForm existingSheet={sheetData} onSuccess={() => fetchDashboardState(activeUser.userId)} />
      </div>
    );
  }

  // Pending_Approval → locked from edits, waiting for manager
  if (sheetData.status === 'Pending_Approval') {
    return (
      <div className="bg-yellow-50 p-10 rounded-xl border border-yellow-200 text-center max-w-lg mx-auto mt-10">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-yellow-800 mb-2">Awaiting Manager Approval</h2>
        <p className="text-yellow-700 text-sm">Your goal sheet has been submitted. Quarterly tracking will unlock once your manager approves and locks the sheet.</p>
        <div className="mt-4 px-4 py-2 bg-yellow-100 rounded-lg inline-block">
          <p className="text-xs font-semibold text-yellow-800">{sheetData.goals.length} goals · Cycle {sheetData.cycle}</p>
        </div>
      </div>
    );
  }

  // Approved & Locked → Phase 2: Quarterly Tracking Engine
  return <EmployeeTracking existingSheet={sheetData} refreshSheet={() => fetchDashboardState(activeUser.userId)} />;
};

export default EmployeeDashboard;

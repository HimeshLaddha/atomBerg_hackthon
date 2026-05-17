import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import axios from 'axios';
import EmployeeGoalForm from './EmployeeGoalForm';
import EmployeeTracking from './EmployeeTracking';

const EmployeeDashboard = () => {
  const { activeUser } = useContext(UserContext);
  const [sheetData, setSheetData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardState = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/goals?userId=${activeUser.userId}`);
      if (res.data && res.data.exists !== false) {
        setSheetData(res.data);
      } else {
        setSheetData(null); // Explicitly null means no sheet exists
      }
    } catch (error) {
      console.error('Failed to fetch dashboard state', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeUser?.userId) {
      fetchDashboardState();
    }
  }, [activeUser]);

  if (loading) {
    return <div className="text-center mt-20 text-gray-500">Loading your workspace...</div>;
  }

  // If no sheet exists, render the Draft Form Workspace
  if (!sheetData) {
    return <EmployeeGoalForm onSuccess={fetchDashboardState} />;
  }

  // If a sheet exists (Draft, Pending, or Approved), render the Unified Tracking Grid
  return <EmployeeTracking existingSheet={sheetData} refreshSheet={fetchDashboardState} />;
};

export default EmployeeDashboard;

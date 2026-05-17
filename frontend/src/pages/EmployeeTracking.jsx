import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import axios from 'axios';
import { calculateProgress } from '../utils/progressEngine';
import EmployeeGoalForm from './EmployeeGoalForm';

const EmployeeTracking = () => {
  const { activeUser } = useContext(UserContext);
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeQuarter, setActiveQuarter] = useState('Q1');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  const fetchSheet = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/goals/${activeUser.userId}/2026-H1`);
      setSheet(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheet();
  }, [activeUser.userId]);

  const handleUpdateAchievement = async (goalId, actualAchievement, status) => {
    setIsSaving(true);
    setMessage('');
    try {
      await axios.put(`http://localhost:5000/api/goals/quarterly/${sheet._id}`, {
        goalId,
        quarter: activeQuarter,
        actualAchievement,
        status,
        changedBy: activeUser.userId
      });
      setMessage('Progress updated successfully.');
      // Update local state without refetching completely for smooth UI
      setSheet((prev) => {
        const newSheet = { ...prev };
        const goalIndex = newSheet.goals.findIndex(g => g._id === goalId);
        if (goalIndex > -1) {
          newSheet.goals[goalIndex].quarterlyAchievements[activeQuarter].actualAchievement = actualAchievement;
          newSheet.goals[goalIndex].quarterlyAchievements[activeQuarter].status = status;
        }
        return newSheet;
      });
    } catch (error) {
      setMessage('Error updating progress: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) return <div className="text-center mt-20 text-gray-500">Loading your goal sheet...</div>;

  // If no sheet or sheet is not locked, show the Goal Form (Draft mode)
  if (!sheet || !sheet.isLocked) {
    if (sheet && sheet.status === 'Pending_Approval') {
      return (
        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 text-center">
          <h2 className="text-xl font-semibold text-yellow-800">Sheet Pending Approval</h2>
          <p className="text-yellow-700 mt-2">Your manager is currently reviewing your goals. You can track progress once it is approved and locked.</p>
        </div>
      );
    }
    return <EmployeeGoalForm existingSheet={sheet} onSuccess={fetchSheet} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quarterly Tracking</h1>
          <p className="text-gray-500 mt-1">Log your achievements and track execution progress.</p>
        </div>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center shadow-sm border border-green-200">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          Locked & Approved
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-md mb-6 text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {message}
        </div>
      )}

      {/* Quarter Tab Selection */}
      <div className="flex space-x-2 mb-8 bg-gray-50 p-2 rounded-lg border border-gray-200 w-fit">
        {quarters.map((q) => (
          <button
            key={q}
            onClick={() => setActiveQuarter(q)}
            className={`px-6 py-2 rounded-md font-semibold transition-all duration-200 text-sm ${
              activeQuarter === q 
                ? 'bg-white text-indigo-700 shadow-sm border border-gray-200' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {sheet.goals.map((goal, index) => {
          const currentQuarterData = goal.quarterlyAchievements[activeQuarter] || {};
          const actual = currentQuarterData.actualAchievement || '';
          const status = currentQuarterData.status || 'Not Started';
          
          // Use Progress Engine!
          const progressScore = calculateProgress(goal.uomType, goal.target, actual);

          return (
            <div key={goal._id} className="p-6 border border-gray-200 rounded-xl bg-gray-50 hover:border-indigo-200 transition-colors">
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Read-only Goal Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className="bg-indigo-100 text-indigo-800 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">{index + 1}</span>
                    <h3 className="text-lg font-bold text-gray-800">{goal.title}</h3>
                    {goal.isShared && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded flex items-center">
                        ★ Shared KPI
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Thrust Area</p>
                      <p className="text-sm font-medium text-gray-800">{goal.thrustArea}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Target ({goal.uomType.replace('_', ' ')})</p>
                      <p className="text-sm font-bold text-indigo-600">{goal.target}</p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-gray-50">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Weightage</p>
                      <p className="text-sm font-medium text-gray-800">{goal.weightage}%</p>
                    </div>
                  </div>
                </div>

                {/* Interactive Tracking Input */}
                <div className="lg:w-1/3 bg-white p-5 rounded-lg border border-indigo-100 shadow-sm flex flex-col justify-center">
                  <h4 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Log {activeQuarter} Results</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Actual Achievement</label>
                      <input 
                        type="text" 
                        value={actual}
                        placeholder={`Enter your ${activeQuarter} actuals...`}
                        onChange={(e) => handleUpdateAchievement(goal._id, e.target.value, status)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Status Selection</label>
                      <select 
                        value={status}
                        onChange={(e) => handleUpdateAchievement(goal._id, actual, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white cursor-pointer"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="On Track">On Track</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  {/* Live Tracker Metric */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progress Score</span>
                      <span className={`text-lg font-black ${progressScore === 100 ? 'text-green-500' : progressScore > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {progressScore}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-500 ease-out ${progressScore === 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : progressScore > 0 ? 'bg-indigo-500' : 'bg-gray-300'}`}
                        style={{ width: `${progressScore}%` }}
                      ></div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeTracking;

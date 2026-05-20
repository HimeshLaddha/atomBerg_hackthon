import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../contexts/UserContext';
import axios from 'axios';
import { calculateProgress, calculateRawProgress } from '../utils/progressEngine';
import EmployeeGoalForm from './EmployeeGoalForm';
import API from '../config/api';

const QUARTER_LABELS = [
  { key: 'Q1', label: 'Q1 Progress' },
  { key: 'Q2', label: 'Q2 Progress' },
  { key: 'Q3', label: 'Q3 Progress' },
  { key: 'Q4', label: 'Q4 Progress' },
];

const TrackingInputCard = React.memo(({ goal, index, activeQuarter, localAchievement, onLocalChange, onSave, isSaving }) => {
  const [actualAchievement, setActualAchievement] = useState(localAchievement?.actualAchievement ?? (goal.quarterlyAchievements[activeQuarter]?.actualAchievement || ''));
  const [status, setStatus] = useState(localAchievement?.status ?? (goal.quarterlyAchievements[activeQuarter]?.status || 'Not Started'));

  useEffect(() => {
    setActualAchievement(localAchievement?.actualAchievement ?? (goal.quarterlyAchievements[activeQuarter]?.actualAchievement || ''));
    setStatus(localAchievement?.status ?? (goal.quarterlyAchievements[activeQuarter]?.status || 'Not Started'));
  }, [localAchievement, goal.quarterlyAchievements, activeQuarter]);

  const handleBlur = (field, value) => {
    onLocalChange(goal._id, field, value);
  };

  const liveActual = actualAchievement;
  const rawScore = calculateRawProgress(goal.uomType, goal.target, liveActual);
  const progressScore = calculateProgress(goal.uomType, goal.target, liveActual);

  return (
    <div className="p-6 border border-gray-200 rounded-xl bg-gray-50 hover:border-indigo-200 transition-colors">
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
        <div className="lg:w-1/3 bg-white p-5 rounded-lg border border-indigo-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Log {activeQuarter} Results</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Actual Achievement</label>
                <input 
                  type="text" 
                  value={actualAchievement}
                  placeholder={`Enter your ${activeQuarter} actuals...`}
                  onChange={(e) => setActualAchievement(e.target.value)}
                  onBlur={(e) => handleBlur('actualAchievement', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                />
                {/* Target Progress Slider Engine (Feature 4) */}
                {['Numeric_Min', 'Percentage_Min', 'Numeric_Max', 'Percentage_Max'].includes(goal.uomType) && !isNaN(Number(goal.target)) && (
                  <div className="mt-3">
                    <input 
                      type="range"
                      min="0"
                      max={Number(goal.target) * 1.5 || 100}
                      step={Number(goal.target) < 100 ? 1 : 10}
                      value={Number(actualAchievement) || 0}
                      onChange={(e) => setActualAchievement(e.target.value)}
                      onBlur={(e) => handleBlur('actualAchievement', e.target.value)}
                      className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 transition-all"
                    />
                    <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-semibold px-1">
                      <span>0</span>
                      <span>Target: {goal.target}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status Selection</label>
                <select 
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); handleBlur('status', e.target.value); }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white cursor-pointer"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="On Track">On Track</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <button
                onClick={() => onSave(goal._id, actualAchievement, status)}
                disabled={isSaving}
                className="w-full mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Progress'}
              </button>
            </div>
          </div>

          {/* Live Tracker Metric */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-1.5">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progress Score</span>
                <span className="ml-2 text-[10px] text-gray-400 font-mono">
                  ({goal.uomType === 'Numeric_Min' || goal.uomType === 'Percentage_Min' ? 'actual÷target' :
                    goal.uomType === 'Numeric_Max' || goal.uomType === 'Percentage_Max' ? 'target÷actual' :
                    goal.uomType === 'Zero-based' ? '0=100%' : 'date'})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {rawScore > 100 && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
                    ★ Overachieved
                  </span>
                )}
                <span className={`text-lg font-black ${
                  rawScore >= 100 ? 'text-green-500' : rawScore > 0 ? 'text-indigo-600' : 'text-gray-400'
                }`}>
                  {rawScore}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                  progressScore === 100
                    ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                    : progressScore > 0 ? 'bg-indigo-500' : 'bg-gray-300'
                }`}
                style={{ width: `${progressScore}%` }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});

const EmployeeTracking = ({ existingSheet, refreshSheet }) => {
  const { activeUser } = useContext(UserContext);
  const [activeQuarter, setActiveQuarter] = useState('Q1');
  const [localAchievements, setLocalAchievements] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const sheet = existingSheet;

  const handleLocalChange = React.useCallback((goalId, field, value) => {
    setLocalAchievements(prev => ({
      ...prev,
      [`${goalId}-${activeQuarter}`]: {
        ...(prev[`${goalId}-${activeQuarter}`] || {}),
        [field]: value
      }
    }));
  }, [activeQuarter]);

  const handleSaveAchievement = React.useCallback(async (goalId, actualAchievement, status) => {
    setIsSaving(true);
    setMessage('');
    try {
      await axios.put(`${API}/api/goals/quarterly/${sheet._id}`, {
        goalId,
        quarter: activeQuarter,
        actualAchievement,
        status,
        changedBy: activeUser.userId
      });
      setMessage('Progress saved successfully.');
      if (refreshSheet) refreshSheet();
    } catch (error) {
      setMessage('Error saving progress: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  }, [sheet?._id, activeQuarter, activeUser?.userId, refreshSheet]);

  if (!sheet) return null;

  if (sheet.status === 'Draft') {
    return (
      <div>
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Draft in Progress</p>
            <p className="text-xs text-amber-600">Your goals have been saved. Review, make changes, then submit for manager approval.</p>
          </div>
        </div>
        <EmployeeGoalForm existingSheet={sheet} onSuccess={refreshSheet} />
      </div>
    );
  }

  if (sheet.status === 'Pending_Approval') {
    return (
      <div className="bg-yellow-50 p-8 rounded-xl border border-yellow-200 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h2 className="text-xl font-semibold text-yellow-800 mb-2">Sheet Pending Approval</h2>
        <p className="text-yellow-700">Your manager is currently reviewing your goals. Quarterly tracking will be unlocked once approved.</p>
      </div>
    );
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

      <div className="flex space-x-1 mb-8 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
        {QUARTER_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveQuarter(key)}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 text-sm ${
              activeQuarter === key
                ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {sheet.goals.map((goal, index) => (
          <TrackingInputCard
            key={goal._id}
            goal={goal}
            index={index}
            activeQuarter={activeQuarter}
            localAchievement={localAchievements[`${goal._id}-${activeQuarter}`]}
            onLocalChange={handleLocalChange}
            onSave={handleSaveAchievement}
            isSaving={isSaving}
          />
        ))}
      </div>
    </div>
  );
};

export default EmployeeTracking;

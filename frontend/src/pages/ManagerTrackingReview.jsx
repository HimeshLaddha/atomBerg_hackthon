import React, { useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import axios from 'axios';
import { calculateProgress } from '../utils/progressEngine';
import CheckInCommentForm from '../components/tracking/CheckInCommentForm';

const ManagerTrackingReview = ({ sheet, onBack, onActionComplete }) => {
  const { activeUser } = useContext(UserContext);
  const [activeQuarter, setActiveQuarter] = useState('Q1');
  const [message, setMessage] = useState('');
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  const handleSaveComment = async (goalId, comment) => {
    setMessage('');
    try {
      await axios.put(`http://localhost:5000/api/goals/manager-checkin/${sheet._id}`, {
        goalId,
        quarter: activeQuarter,
        managerComment: comment,
        changedBy: activeUser.userId
      });
      setMessage('Check-in comment saved successfully.');
      setTimeout(() => setMessage(''), 3000);
      // Let it quietly succeed, the user doesn't need a full refresh if we map state, but for MVP we trigger the refresh if needed or just show message.
    } catch (error) {
      console.error(error);
      setMessage('Failed to save comment: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
        <div>
          <button onClick={onBack} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-2 flex items-center">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Quarterly Check-In: {sheet.employeeId.name}</h1>
          <p className="text-gray-500 mt-1">Reviewing execution progress for Cycle {sheet.cycle}</p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-md mb-6 text-sm font-medium ${message.includes('Failed') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
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
            {q} Performance
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {sheet.goals.map((goal, index) => {
          const currentQuarterData = goal.quarterlyAchievements[activeQuarter] || {};
          const actual = currentQuarterData.actualAchievement || '';
          const status = currentQuarterData.status || 'Not Started';
          const managerComment = currentQuarterData.managerComment || '';
          
          const progressScore = calculateProgress(goal.uomType, goal.target, actual);

          return (
            <div key={goal._id} className="p-6 border border-gray-200 rounded-xl bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-indigo-100 text-indigo-800 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-sm mr-3">{index + 1}</span>
                {goal.title}
              </h3>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Planned Target */}
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100 uppercase tracking-wider">Planned Target</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Thrust Area</p>
                      <p className="text-sm font-medium text-gray-800">{goal.thrustArea}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">UoM</p>
                      <p className="text-sm font-medium text-gray-800">{goal.uomType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Expected Target</p>
                      <p className="text-lg font-black text-indigo-600">{goal.target}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Weightage</p>
                      <p className="text-sm font-medium text-gray-800">{goal.weightage}%</p>
                    </div>
                  </div>
                </div>

                {/* Actual Achievement */}
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100 uppercase tracking-wider flex justify-between">
                      Employee Actuals
                      <span className={`px-2 py-0.5 text-xs rounded-full ${status === 'Completed' ? 'bg-green-100 text-green-800' : status === 'On Track' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {status}
                      </span>
                    </h4>
                    
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Reported Achievement</p>
                      <p className="text-lg font-black text-gray-800">{actual || <span className="text-gray-400 italic font-normal">No data logged yet</span>}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Computed Score</span>
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

                  {/* Manager Check-in Form Component */}
                  <div className="mt-4">
                    <CheckInCommentForm 
                      initialComment={managerComment} 
                      onSave={(comment) => handleSaveComment(goal._id, comment)} 
                    />
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

export default ManagerTrackingReview;

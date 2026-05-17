import React, { useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import axios from 'axios';

const ManagerReview = ({ sheet, onBack, onActionComplete }) => {
  const { activeUser } = useContext(UserContext);
  const [goals, setGoals] = useState(sheet.goals);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const totalWeightage = goals.reduce((sum, g) => sum + (Number(g.weightage) || 0), 0);
  const isTotalValid = totalWeightage === 100;
  const areIndividualWeightagesValid = goals.every(g => Number(g.weightage) >= 10);
  const isFormValid = isTotalValid && areIndividualWeightagesValid;

  const handleChange = (id, field, value) => {
    setGoals(goals.map(g => (g._id === id ? { ...g, [field]: value } : g)));
  };

  const handleAction = async (actionType) => {
    if (actionType === 'approve' && !isFormValid) return;
    
    setIsSubmitting(true);
    setMessage('');
    try {
      await axios.put(`http://localhost:5000/api/goals/review/${sheet._id}`, {
        action: actionType,
        goals,
        changedBy: activeUser.userId
      });
      onActionComplete();
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || 'Failed to process action');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
        <div>
          <button onClick={onBack} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-2 flex items-center">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Review Goals: {sheet.employeeId.name}</h1>
          <p className="text-gray-500 mt-1">Cycle: {sheet.cycle}</p>
        </div>
      </div>

      {/* Real-time Validation Bar */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-700">Adjusted Total Weightage</span>
          <span className={`font-bold text-lg ${isTotalValid ? 'text-green-600' : 'text-red-600'}`}>
            {totalWeightage}% / 100%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-2.5 rounded-full transition-all duration-300 ${isTotalValid ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(totalWeightage, 100)}%` }}
          ></div>
        </div>
        {!isTotalValid && (
          <p className="text-red-500 text-sm mt-2">Manager adjustments must preserve the 100% total rule before approval.</p>
        )}
      </div>

      <div className="space-y-6">
        {goals.map((goal, index) => (
          <div key={goal._id} className="p-5 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <span className="bg-indigo-100 text-indigo-800 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">{index + 1}</span>
                {goal.title}
              </h3>
              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-md">{goal.thrustArea}</span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target ({goal.uomType})</label>
                <input 
                  type="text" 
                  value={goal.target} 
                  onChange={(e) => handleChange(goal._id, 'target', e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weightage (%)</label>
                <input 
                  type="number" 
                  min="10"
                  max="100"
                  value={goal.weightage} 
                  onChange={(e) => handleChange(goal._id, 'weightage', e.target.value)} 
                  className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white ${Number(goal.weightage) < 10 ? 'border-red-500' : 'border-gray-300'}`} 
                />
                {Number(goal.weightage) < 10 && (
                  <p className="text-red-500 text-xs mt-1">Weightage must be ≥ 10%.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <button 
          onClick={() => handleAction('return')}
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-semibold rounded-md border-2 border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-colors"
        >
          Return for Rework
        </button>

        <button 
          onClick={() => handleAction('approve')}
          disabled={!isFormValid || isSubmitting}
          className={`px-8 py-2.5 text-sm font-bold rounded-md shadow-sm text-white transition-colors ${!isFormValid || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isSubmitting ? 'Processing...' : 'Approve & Lock'}
        </button>
      </div>
      
      {message && (
        <div className="p-4 rounded-md mt-4 bg-red-50 text-red-800 border border-red-200">
          {message}
        </div>
      )}
    </div>
  );
};

export default ManagerReview;

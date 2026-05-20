import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../contexts/UserContext';
import axios from 'axios';
import API from '../config/api';

const UOM_TYPES = ['Numeric_Min', 'Percentage_Min', 'Numeric_Max', 'Percentage_Max', 'Zero-based', 'Timeline'];

const defaultGoal = {
  thrustArea: '',
  title: '',
  description: '',
  uomType: 'Numeric_Min',
  target: '',
  weightage: ''
};

const GoalCard = React.memo(({ goal, index, totalGoals, onRemove, onChange, UOM_TYPES }) => {
  const [localData, setLocalData] = useState(goal);

  useEffect(() => {
    setLocalData(goal);
  }, [goal]);

  const handleLocalChange = (field, value) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field) => {
    if (localData[field] !== goal[field]) {
      onChange(goal.id, field, localData[field]);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-lg bg-gray-50 relative group">
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {totalGoals > 1 && !goal.isShared && (
          <button type="button" onClick={() => onRemove(goal.id)} className="text-red-500 hover:text-red-700 text-sm font-medium bg-red-50 px-2 py-1 rounded">
            Remove Goal
          </button>
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
        <span className="bg-indigo-100 text-indigo-800 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">{index + 1}</span>
        Goal Details
        {goal.isShared && (
          <span className="ml-3 inline-flex items-center px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full border border-blue-200">
            📡 Shared KPI — Title & Target locked by HR
          </span>
        )}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Thrust Area</label>
          {goal.isShared ? (
            <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-600 text-sm cursor-not-allowed">{goal.thrustArea}</div>
          ) : (
            <input type="text" value={localData.thrustArea} onChange={(e) => handleLocalChange('thrustArea', e.target.value)} onBlur={() => handleBlur('thrustArea')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white" required />
          )}
        </div>
        
        <div className="md:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
          {goal.isShared ? (
            <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-600 text-sm cursor-not-allowed">{goal.title}</div>
          ) : (
            <input type="text" value={localData.title} onChange={(e) => handleLocalChange('title', e.target.value)} onBlur={() => handleBlur('title')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white" required />
          )}
        </div>

        <div className="md:col-span-12">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          {goal.isShared ? (
            <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-600 text-sm cursor-not-allowed min-h-[64px]">{goal.description || '—'}</div>
          ) : (
            <textarea
              value={localData.description}
              onChange={(e) => handleLocalChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              rows="2"
            />
          )}
        </div>

        <div className="md:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measurement</label>
          {goal.isShared ? (
            <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-600 text-sm cursor-not-allowed">{goal.uomType.replace('_', ' ')}</div>
          ) : (
            <select value={localData.uomType} onChange={(e) => handleLocalChange('uomType', e.target.value)} onBlur={() => handleBlur('uomType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white">
              {UOM_TYPES.map(type => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
            </select>
          )}
        </div>

        <div className="md:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
          {goal.isShared ? (
            <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-600 text-sm cursor-not-allowed">{goal.target}</div>
          ) : (
            <input
              type="text"
              value={localData.target}
              onChange={(e) => handleLocalChange('target', e.target.value)}
              onBlur={() => handleBlur('target')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              required
              placeholder="e.g., 5000, 100%, 2026-12-31"
            />
          )}
        </div>

        <div className="md:col-span-12 border-t border-gray-200 mt-2 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Weightage (%)</label>
          <input 
            type="number" 
            min="0"
            max="100"
            value={localData.weightage} 
            onChange={(e) => handleLocalChange('weightage', e.target.value)} 
            onBlur={() => handleBlur('weightage')}
            className={`w-1/3 px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white ${Number(localData.weightage) > 0 && Number(localData.weightage) < 10 ? 'border-red-500' : 'border-gray-300'}`} 
            required 
          />
          {Number(localData.weightage) > 0 && Number(localData.weightage) < 10 && (
            <p className="text-red-500 text-sm mt-1">Warning: Minimum weightage per individual goal is 10%.</p>
          )}
        </div>
      </div>
    </div>
  );
});

const EmployeeGoalForm = ({ existingSheet, onSuccess }) => {
  const { activeUser } = useContext(UserContext);

  const buildGoals = (sheet) => sheet?.goals?.length > 0
    ? sheet.goals.map(g => ({ ...g, id: g.goalId || `${Date.now()}-${Math.random()}` }))
    : [{ ...defaultGoal, id: Date.now() }];

  const [goals, setGoals] = useState(() => buildGoals(existingSheet));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Wipe & rebuild form whenever the active user switches — prevents data bleed
  useEffect(() => {
    setGoals(buildGoals(existingSheet));
    setMessage('');
  }, [activeUser?.userId, existingSheet]);

  const totalWeightage = goals.reduce((sum, g) => sum + (Number(g.weightage) || 0), 0);
  const isTotalValid = totalWeightage === 100;
  const areIndividualWeightagesValid = goals.every(g => Number(g.weightage) >= 10);
  const isFormValid = isTotalValid && areIndividualWeightagesValid && goals.length <= 8 && goals.every(g => g.title && g.target && g.thrustArea);

  const handleAddGoal = () => {
    if (goals.length < 8) {
      setGoals([...goals, { ...defaultGoal, id: Date.now() }]);
    }
  };

  const handleRemoveGoal = React.useCallback((id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const handleChange = React.useCallback((id, field, value) => {
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, [field]: value } : g)));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    try {
      await axios.post(`${API}/api/goals/save`, {
        employeeId: activeUser.userId,
        cycle: '2026-H1',
        goals: goals.map(({ id, _id, ...rest }) => ({ ...rest, goalId: id.toString() }))
      });
      setMessage('Draft saved successfully!');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    setMessage('');
    try {
      await axios.post(`${API}/api/goals/submit`, {
        employeeId: activeUser.userId,
        cycle: '2026-H1',
        goals: goals.map(({ id, _id, ...rest }) => ({ ...rest, goalId: id.toString() }))
      });
      setMessage('Goal sheet submitted successfully for approval!');
      if (onSuccess) onSuccess(); 
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || 'Failed to submit goal sheet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="mb-8 border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Draft Goal Sheet</h1>
        <p className="text-gray-500 mt-1">Define your objectives for the 2026-H1 cycle.</p>
      </div>

      {/* Real-time Validation Bar */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-700">Total Weightage</span>
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
          <p className="text-red-500 text-sm mt-2">Total weightage must exactly equal 100%.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {goals.map((goal, index) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            index={index}
            totalGoals={goals.length}
            onRemove={handleRemoveGoal}
            onChange={handleChange}
            UOM_TYPES={UOM_TYPES}
          />
        ))}

        <div className="flex flex-col md:flex-row justify-between items-center pt-4 gap-4">
          <button 
            type="button" 
            onClick={handleAddGoal} 
            disabled={goals.length >= 8}
            className={`w-full md:w-auto px-4 py-2 text-sm font-medium rounded-md ${goals.length >= 8 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50'}`}
          >
            + Add Another Goal {goals.length >= 8 && '(Max 8 Reached)'}
          </button>

          <div className="flex flex-col md:flex-row w-full md:w-auto space-y-3 md:space-y-0 md:space-x-3">
            <button 
              type="button" 
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full md:w-auto px-4 py-2 text-sm font-medium rounded-md shadow-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button 
              type="submit" 
              disabled={!isFormValid || isSubmitting}
              className={`w-full md:w-auto px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white ${!isFormValid || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </div>
        
        {message && (
          <div className={`p-4 rounded-md mt-4 ${message.includes('success') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default EmployeeGoalForm;

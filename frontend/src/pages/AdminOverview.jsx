import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API from '../config/api';

const AdminOverview = () => {
  const [approvedSheets, setApprovedSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovedSheets = async () => {
      try {
        const res = await axios.get(`${API}/api/goals/approved`);
        // Sort sheets alphabetically by employee name
        const sortedSheets = (res.data || []).sort((a, b) => 
          a.employeeId.name.localeCompare(b.employeeId.name)
        );
        setApprovedSheets(sortedSheets);
      } catch (error) {
        console.error('Failed to fetch approved sheets', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedSheets();
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading organization goals...</div>;
  }

  if (approvedSheets.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Organization Overview</h2>
        <p className="text-gray-500">No approved goal sheets found across the organization yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Organization Overview</h1>
        <p className="text-gray-500 mt-1">View all locked and approved goals across all departments.</p>
      </div>

      <div className="space-y-8">
        {approvedSheets.map((sheet) => {
          const totalWeightage = sheet.goals.reduce((sum, g) => sum + (Number(g.weightage) || 0), 0);
          
          return (
            <div key={sheet._id} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-indigo-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{sheet.employeeId.name}</h2>
                  <p className="text-sm text-indigo-600 font-medium">{sheet.employeeId.department}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-1">
                    Locked / Approved
                  </span>
                  <p className="text-xs text-gray-500">Cycle: {sheet.cycle}</p>
                </div>
              </div>
              
              <div className="p-6 bg-white">
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Finalized Goals</h3>
                  <span className="text-sm font-medium text-gray-600">Total Weightage: {totalWeightage}%</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thrust Area</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UoM</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sheet.goals.map((goal) => (
                        <tr key={goal._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{goal.thrustArea}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{goal.title}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{goal.uomType.replace('_', ' ')}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-indigo-600">{goal.target}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{goal.weightage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminOverview;

import React, { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

const RoleSwitcher = () => {
  const { activeRoleName, switchRole } = useContext(UserContext);
  const navigate = useNavigate();
  const roles = ['Employee', 'Manager (L1)', 'Admin/HR'];

  const handleRoleSwitch = (role) => {
    switchRole(role);
    if (role === 'Employee') navigate('/employee/goals');
    else if (role === 'Manager (L1)') navigate('/manager/dashboard');
    else if (role === 'Admin/HR') navigate('/admin/overview');
  };

  return (
    <div className="fixed top-0 w-full bg-indigo-900 shadow-lg z-50 p-2 flex justify-center items-center border-b border-indigo-950">
      <div className="flex items-center space-x-3 bg-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
        <span className="text-sm font-semibold text-indigo-100 uppercase tracking-wider">Hackathon Role Switcher:</span>
        <div className="flex bg-indigo-950/50 p-1 rounded-full">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => handleRoleSwitch(role)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                activeRoleName === role
                  ? 'bg-blue-500 text-white shadow-md scale-105'
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSwitcher;

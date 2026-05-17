import React, { useContext, useRef, useState, useEffect } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

const ROLE_META = {
  'Employee': {
    icon: '👤',
    color: 'from-violet-500 to-indigo-600',
    bg: 'bg-violet-50 text-violet-700 border-violet-200',
    desc: 'Goal Setting & Tracking'
  },
  'Manager (L1)': {
    icon: '🏆',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Team Approvals & Check-ins'
  },
  'Admin/HR': {
    icon: '⚙️',
    color: 'from-blue-500 to-indigo-700',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Governance & Analytics'
  }
};

const RoleSwitcher = () => {
  const { activeRoleName, activeUser, switchRole } = useContext(UserContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const roles = Object.keys(ROLE_META);
  const currentMeta = ROLE_META[activeRoleName];

  const handleRoleSwitch = (role) => {
    switchRole(role);
    setOpen(false);
    if (role === 'Employee') navigate('/employee/goals');
    else if (role === 'Manager (L1)') navigate('/manager/dashboard');
    else if (role === 'Admin/HR') navigate('/admin/overview');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo / Brand */}
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentMeta.color} flex items-center justify-center shadow-md transition-all duration-500`}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-none">GoalSync Portal</h1>
            <p className="text-xs text-gray-400 leading-none mt-0.5">2026-H1 Cycle</p>
          </div>
        </div>

        {/* Active User Info */}
        <div className="hidden md:flex items-center space-x-6">
          <div className="text-right">
            <p className="text-xs text-gray-500 leading-none mb-0.5">Simulating as</p>
            <p className="text-sm font-semibold text-gray-800 leading-none">{activeUser?.name}</p>
          </div>

          {/* Evaluator Role Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${currentMeta.bg}`}
            >
              <span className="text-base leading-none">{currentMeta.icon}</span>
              <span>{activeRoleName}</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Evaluator Role Switcher</p>
                  <p className="text-xs text-gray-400 mt-0.5">Switch persona to test different views</p>
                </div>
                {roles.map((role) => {
                  const meta = ROLE_META[role];
                  const isActive = activeRoleName === role;
                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${isActive ? 'bg-indigo-50' : ''}`}
                    >
                      <span className="text-lg leading-none">{meta.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>{role}</p>
                        <p className="text-xs text-gray-400 truncate">{meta.desc}</p>
                      </div>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default RoleSwitcher;

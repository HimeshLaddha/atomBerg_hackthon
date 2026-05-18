import React, { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { Link, useLocation } from 'react-router-dom';

// Keys match sessionUser.role values from UserContext / Login.jsx
const NAV_CONFIG = {
  'Employee': {
    gradient: 'from-violet-500 to-indigo-600',
    badge: 'bg-violet-100 text-violet-700',
    links: [
      {
        name: 'My Goal Sheet',
        path: '/employee/goals',
        desc: 'Draft, submit & track progress',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )
      }
    ]
  },
  // 'Manager' matches sessionUser.role — was previously 'Manager (L1)'
  'Manager': {
    gradient: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-100 text-emerald-700',
    links: [
      {
        name: 'Team Dashboard',
        path: '/manager/dashboard',
        desc: 'Approvals queue & check-ins',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      }
    ]
  },
  // 'Admin' matches sessionUser.role — was previously 'Admin/HR'
  'Admin': {
    gradient: 'from-blue-500 to-indigo-700',
    badge: 'bg-blue-100 text-blue-700',
    links: [
      {
        name: 'Governance Panel',
        path: '/admin/overview',
        desc: 'KPIs, matrix & audit logs',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      },
      {
        name: 'Admin Dashboard',
        path: '/admin/dashboard',
        desc: 'Completion tracker & CSV export',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )
      }
    ]
  }
};

const Sidebar = () => {
  const { activeUser } = useContext(UserContext);
  const location = useLocation();
  // Use sessionUser.role directly — matches NAV_CONFIG keys ('Employee','Manager','Admin')
  const role = activeUser?.role || 'Employee';
  const config = NAV_CONFIG[role] || NAV_CONFIG['Employee'];

  return (
    <div className="w-64 bg-white border-r border-gray-100 h-[calc(100vh-64px)] fixed left-0 flex flex-col shadow-sm">

      {/* User Identity Card */}
      <div className={`m-4 p-4 rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-md`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold backdrop-blur-sm">
            {activeUser?.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-none truncate">{activeUser?.name}</p>
            <p className="text-xs text-white/70 mt-1 leading-none">{activeUser?.department}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
          <span className="text-xs text-white/80 font-medium">Active Role</span>
          <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{activeUser?.role}</span>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="px-4 mb-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Navigation</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {config.links.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? `bg-gradient-to-r ${config.gradient} text-white shadow-md`
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {link.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-none truncate">{link.name}</p>
                <p className={`text-xs mt-0.5 truncate ${isActive ? 'text-white/70' : 'text-gray-400'}`}>{link.desc}</p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Flow Reference Key */}
      <div className="m-4 p-3 bg-gray-50 border border-gray-100 rounded-xl">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Flow</p>
        {role === 'Employee' && (
          <div className="space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
              <span>No Sheet → Phase 1 Form</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
              <span>Sheet Exists → Q1–Q4 Grid</span>
            </div>
          </div>
        )}
        {role === 'Manager' && (
          <div className="space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Phase 1: Approvals Queue</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Phase 2: Check-in Workspace</span>
            </div>
          </div>
        )}
        {role === 'Admin' && (
          <div className="space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
              <span>Shared KPIs & Matrix</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
              <span>Export & Audit Logs</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

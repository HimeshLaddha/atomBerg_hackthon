import React, { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const { activeRoleName, activeUser } = useContext(UserContext);
  const location = useLocation();

  const employeeLinks = [
    { name: 'My Goal Sheet', path: '/employee/goals' },
  ];

  const managerLinks = [
    { name: 'Team Dashboard', path: '/manager/dashboard' },
  ];

  const adminLinks = [
    { name: 'Organization Overview', path: '/admin/overview' },
  ];

  let links = [];
  if (activeRoleName === 'Employee') links = employeeLinks;
  if (activeRoleName === 'Manager (L1)') links = managerLinks;
  if (activeRoleName === 'Admin/HR') links = adminLinks;

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-64px)] fixed left-0 flex flex-col pt-4">
      <div className="px-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800">Goal Portal</h2>
        <p className="text-sm text-gray-500 mt-1">Simulating as:</p>
        <p className="text-sm font-semibold text-indigo-600">{activeUser.name}</p>
        <p className="text-xs text-gray-400">{activeUser.role} - {activeUser.department}</p>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;

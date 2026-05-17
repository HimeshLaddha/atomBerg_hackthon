import React from 'react';
import RoleSwitcher from './RoleSwitcher';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Role Switcher */}
      <RoleSwitcher />
      
      {/* Main Content Area */}
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        {/* Main Workspace */}
        <main className="flex-1 ml-64 p-8 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

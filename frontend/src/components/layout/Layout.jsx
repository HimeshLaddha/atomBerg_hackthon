import React, { useState } from 'react';
import RoleSwitcher from './RoleSwitcher';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-950 text-slate-100 font-sans overflow-x-hidden">
      {/* Global Top Navigation Bar */}
      <RoleSwitcher toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
      
      {/* Main Content Area */}
      <div className="flex flex-1 pt-16">
        <Sidebar mobileMenuOpen={mobileMenuOpen} closeMobileMenu={() => setMobileMenuOpen(false)} />
        
        {/* Mobile backdrop */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Main Workspace */}
        <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 overflow-y-auto h-[calc(100vh-64px)] bg-slate-950 w-full max-w-full">
          <div className="w-full max-w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

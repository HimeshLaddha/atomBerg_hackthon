import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { UserProvider } from './contexts/UserContext';
import EmployeeTracking from './pages/EmployeeTracking';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/employee/goals" replace />} />
            <Route path="employee/goals" element={<EmployeeTracking />} />
            <Route path="manager/dashboard" element={<ManagerDashboard />} />
            <Route path="admin/overview" element={<AdminPanel />} />
          </Route>
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;

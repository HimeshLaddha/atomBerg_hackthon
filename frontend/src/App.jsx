import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { UserProvider, UserContext } from './contexts/UserContext';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminPanel from './pages/AdminPanel';
import AdminDashboard from './pages/AdminDashboard';

// ─── Route guard: bounces unauthenticated visits back to /login ───────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(UserContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// ─── Dashboard dispatcher: routes to the correct view by role ─────────────────
const DashboardDispatcher = () => {
  const { sessionUser } = useContext(UserContext);
  if (!sessionUser) return <Navigate to="/login" replace />;

  if (sessionUser.role === 'Manager') return <Navigate to="/manager/dashboard" replace />;
  if (sessionUser.role === 'Admin') return <Navigate to="/admin/overview" replace />;
  return <Navigate to="/employee/goals" replace />;
};

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* Public auth route */}
          <Route path="/login" element={<Login />} />

          {/* Protected app shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Root → /login if not authenticated; handled by ProtectedRoute above */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Smart dashboard dispatcher */}
            <Route path="dashboard" element={<DashboardDispatcher />} />

            {/* Role-specific views */}
            <Route path="employee/goals" element={<EmployeeDashboard />} />
            <Route path="manager/dashboard" element={<ManagerDashboard />} />
            <Route path="admin/overview" element={<AdminPanel />} />
            <Route path="admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;

import React, { createContext, useState, useEffect, useCallback } from 'react';

export const UserContext = createContext();

// ─── Hardcoded mock users (legacy role-switcher identities) ───────────────────
const MOCK_USERS = {
  'Employee': {
    userId: 'EMP-003',
    name: 'Charlie Employee',
    role: 'Employee',
    department: 'Engineering',
  },
  'Employee (Diana)': {
    userId: 'EMP-004',
    name: 'Diana Employee',
    role: 'Employee',
    department: 'Engineering',
  },
  'Manager (L1)': {
    userId: 'EMP-002',
    name: 'Bob Manager',
    role: 'Manager',
    department: 'Engineering',
  },
  'Admin/HR': {
    userId: 'EMP-001',
    name: 'Alice Admin',
    role: 'Admin',
    department: 'Human Resources',
  },
};

// ─── Session storage helpers ──────────────────────────────────────────────────
const SESSION_KEY = 'goalsync_session';

const loadSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveSession = (user) => {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

// ─── Role-name → legacy route mapping ────────────────────────────────────────
const getRoleNameFromRole = (role) => {
  if (role === 'Employee') return 'Employee';
  if (role === 'Manager') return 'Manager (L1)';
  if (role === 'Admin') return 'Admin/HR';
  return 'Employee';
};

export const UserProvider = ({ children }) => {
  // ── Session state (login/logout flow) ──────────────────────────────────────
  const [sessionUser, setSessionUser] = useState(() => loadSession());

  // ── Legacy role-switcher state (used inside the dashboard) ─────────────────
  const savedRole = localStorage.getItem('activeRoleName');
  const initialRole = savedRole && MOCK_USERS[savedRole] ? savedRole : 'Employee';
  const [activeRoleName, setActiveRoleName] = useState(initialRole);
  const [activeUser, setActiveUser] = useState(MOCK_USERS[initialRole]);

  // Sync activeUser whenever activeRoleName changes
  useEffect(() => {
    setActiveUser(MOCK_USERS[activeRoleName]);
    localStorage.setItem('activeRoleName', activeRoleName);
  }, [activeRoleName]);

  // ── login: called from Login.jsx persona cards ─────────────────────────────
  const login = useCallback((userObject) => {
    saveSession(userObject);
    setSessionUser(userObject);

    // Also sync the legacy role-switcher to match the selected persona
    const roleName = getRoleNameFromRole(userObject.role);
    setActiveRoleName(roleName);
    setActiveUser(MOCK_USERS[roleName]);
    localStorage.setItem('activeRoleName', roleName);
  }, []);

  // ── logout: purges session and resets everything ───────────────────────────
  const logout = useCallback(() => {
    saveSession(null);
    setSessionUser(null);
    setActiveRoleName('Employee');
    setActiveUser(MOCK_USERS['Employee']);
    localStorage.removeItem('activeRoleName');
  }, []);

  // ── Legacy switchRole (still used by in-app dropdowns if kept) ────────────
  const switchRole = useCallback((roleName) => {
    if (MOCK_USERS[roleName]) {
      setActiveRoleName(roleName);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        // Session API
        sessionUser,
        isAuthenticated: !!sessionUser,
        login,
        logout,
        // Legacy role-switcher API (preserved for existing pages)
        activeUser,
        activeRoleName,
        switchRole,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

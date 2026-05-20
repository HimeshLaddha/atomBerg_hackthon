import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';

export const UserContext = createContext();

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

// ─────────────────────────────────────────────────────────────────────────────
export const UserProvider = ({ children }) => {
  // Single source of truth — the logged-in user object from Login.jsx
  const [sessionUser, setSessionUser] = useState(() => loadSession());

  // activeUser === sessionUser. Kept as an alias so all existing
  // components that read `activeUser` continue to work without changes.
  const activeUser = sessionUser;

  // ── login: called from Login.jsx after credential check ───────────────────
  const login = useCallback((userObject) => {
    saveSession(userObject);
    setSessionUser(userObject);
  }, []);

  // ── logout: purges session completely ─────────────────────────────────────
  const logout = useCallback(() => {
    saveSession(null);
    setSessionUser(null);
    localStorage.removeItem('activeRoleName'); // clean up legacy key if present
  }, []);

  // ── Legacy switchRole stub — kept so any old component that calls
  //    switchRole() doesn't crash. It's a no-op since persona switching
  //    now happens via Login.jsx logout → re-login flow.
  const switchRole = useCallback(() => {}, []);

  const contextValue = useMemo(() => ({
    // Session API
    sessionUser,
    isAuthenticated: !!sessionUser,
    login,
    logout,
    // activeUser is always the real logged-in user — never a mock fallback
    activeUser,
    // Legacy shims (kept for backward compat — safe to remove later)
    activeRoleName: sessionUser?.role ?? 'Employee',
    switchRole,
  }), [sessionUser, login, logout, activeUser, switchRole]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // Hardcoded mock users based on seed data
  const MOCK_USERS = {
    Employee: { userId: 'EMP-003', name: 'Charlie Employee', role: 'Employee', department: 'Engineering' },
    'Manager (L1)': { userId: 'EMP-002', name: 'Bob Manager', role: 'Manager', department: 'Engineering' },
    'Admin/HR': { userId: 'EMP-001', name: 'Alice Admin', role: 'Admin', department: 'Human Resources' }
  };

  const [activeRoleName, setActiveRoleName] = useState('Employee');
  const [activeUser, setActiveUser] = useState(MOCK_USERS['Employee']);

  useEffect(() => {
    setActiveUser(MOCK_USERS[activeRoleName]);
  }, [activeRoleName]);

  const switchRole = (roleName) => {
    if (MOCK_USERS[roleName]) {
      setActiveRoleName(roleName);
    }
  };

  return (
    <UserContext.Provider value={{ activeUser, activeRoleName, switchRole }}>
      {children}
    </UserContext.Provider>
  );
};

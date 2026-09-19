import React from 'react';
import { NotificationProvider } from './NotificationContext';
import { UserProvider } from './UserContext';
import { ProjectDataProvider } from './ProjectDataContext';

export function AppProvider({ children }) {
  return (
    <NotificationProvider>
      <UserProvider>
        <ProjectDataProvider>
          {children}
        </ProjectDataProvider>
      </UserProvider>
    </NotificationProvider>
  );
}

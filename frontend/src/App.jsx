import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import DashboardModule from './modules/dashboard/DashboardModule';
import SettingsModule from './modules/settings/SettingsModule';
import BusinessInfoView from './modules/business-info';
import GoogleStackView from './modules/google-stack';
import ProfileCreationView from './modules/profile-creation';
import IndexingModuleView from './modules/indexing';
import SocialPbnPosterView from './modules/social-pbn-poster';
import { useNotification } from './context/NotificationContext';
import Notification from './components/common/Notification';

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { notification } = useNotification();

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardModule />;
      case 'settings': return <SettingsModule />;
      case 'business-info': return <BusinessInfoView />;
      case 'google-stack': return <GoogleStackView />;
      case 'profile-creation': return <ProfileCreationView />;
      case 'indexing': return <IndexingModuleView />;
      case 'social-pbn': return <SocialPbnPosterView />;
      default: return <DashboardModule />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <Sidebar 
        isOpen={isSidebarOpen} 
        activeModule={activeModule} 
        setActiveModule={setActiveModule} 
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-950">
          <div className="mx-auto max-w-[1600px]">
            {renderModule()}
          </div>
        </main>
      </div>
      
      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}
    </div>
  );
}

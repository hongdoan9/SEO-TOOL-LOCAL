import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useUser } from './UserContext';
import { useNotification } from './NotificationContext';

const ProjectDataContext = createContext();

export function ProjectDataProvider({ children }) {
  const { selectedProject } = useUser();
  const { showNotification } = useNotification();

  const [settings, setSettings] = useState({});
  const [businessInfo, setBusinessInfo] = useState({});
  const [googleStacks, setGoogleStacks] = useState([]);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    if (selectedProject) {
      fetchSettings(selectedProject.id);
      fetchBusinessInfo(selectedProject.id);
      fetchGoogleStacks(selectedProject.id);
      checkGoogleAuth(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchSettings = async (projectId) => {
    try {
      const res = await api.get(`/settings/${projectId}`);
      setSettings(res.data || {});
    } catch (e) { console.error(e); }
  };

  const handleSaveSettings = async (data) => {
    if (!selectedProject) return;
    try {
      await api.post(`/settings/${selectedProject.id}`, data);
      setSettings(data);
      showNotification('Đã lưu Cài đặt API thành công!');
    } catch (e) {
      showNotification('Lỗi khi lưu Cài đặt', 'error');
    }
  };

  const fetchBusinessInfo = async (projectId) => {
    try {
      const res = await api.get(`/business-info/${projectId}`);
      if (res.data) {
        const parsedPhones = typeof res.data.phones === 'string' ? JSON.parse(res.data.phones || '[]') : (res.data.phones || []);
        const rawAddresses = typeof res.data.addresses === 'string' ? JSON.parse(res.data.addresses || '[]') : (res.data.addresses || []);
        // Migration: convert old string[] format to object[] format
        const parsedAddresses = rawAddresses.map(item =>
          typeof item === 'string'
            ? { address: item, map_url: '', lat: '', lng: '' }
            : item
        );
        setBusinessInfo({
          ...res.data,
          phones: parsedPhones,
          addresses: parsedAddresses
        });
      } else {
        setBusinessInfo({});
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveBusinessInfo = async (data) => {
    if (!selectedProject) return;
    try {
      await api.post(`/business-info/${selectedProject.id}`, data);
      setBusinessInfo(data);
      showNotification('Đã lưu Thông tin Doanh nghiệp!');
    } catch (e) {
      showNotification('Lỗi khi lưu Thông tin Doanh nghiệp', 'error');
    }
  };

  const fetchGoogleStacks = async (projectId) => {
    try {
      const res = await api.get(`/google-stacks/${projectId}`);
      setGoogleStacks(res.data || []);
    } catch (e) { console.error(e); }
  };

  const checkGoogleAuth = async (projectId) => {
    try {
      const res = await api.get(`/google/status/${projectId}`);
      setGoogleConnected(res.data.connected || false);
    } catch (e) { setGoogleConnected(false); }
  };
  
  const handleConnectGoogle = async () => {
    if (!selectedProject) return;
    try {
      const res = await api.get(`/google/auth-url/${selectedProject.id}`);
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      showNotification('Chưa cấu hình Google Client ID/Secret trong Settings!', 'error');
    }
  };

  return (
    <ProjectDataContext.Provider value={{
      settings, setSettings, handleSaveSettings,
      businessInfo, setBusinessInfo, handleSaveBusinessInfo,
      googleStacks, setGoogleStacks, fetchGoogleStacks,
      googleConnected, handleConnectGoogle
    }}>
      {children}
    </ProjectDataContext.Provider>
  );
}

export function useProjectData() {
  return useContext(ProjectDataContext);
}

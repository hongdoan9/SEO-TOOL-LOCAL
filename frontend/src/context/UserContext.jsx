import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from './NotificationContext';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
      if (res.data && res.data.length > 0 && !selectedUser) {
        setSelectedUser(res.data[0]);
      }
    } catch (e) {
      showNotification('Không thể kết nối Backend Server!', 'error');
    }
  };

  const handleCreateUser = async (name) => {
    try {
      const res = await api.post('/users', { name });
      setUsers(prev => [...prev, res.data]);
      setSelectedUser(res.data);
      showNotification('Tạo User mới thành công!');
    } catch (e) {
      showNotification('Lỗi khi tạo User mới', 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa User này?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      setSelectedUser(null);
      showNotification('Đã xóa User thành công');
    } catch (e) {
      showNotification('Lỗi khi xóa User', 'error');
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchProjects(selectedUser.id);
    } else {
      setProjects([]);
      setSelectedProject(null);
    }
  }, [selectedUser]);

  const fetchProjects = async (userId) => {
    try {
      const res = await api.get(`/projects/${userId}`);
      setProjects(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedProject(res.data[0]);
      } else {
        setSelectedProject(null);
      }
    } catch (e) {
      console.error('Lỗi khi lấy danh sách dự án:', e);
      setProjects([]);
      setSelectedProject(null);
    }
  };

  const handleCreateProject = async (name, description) => {
    if (!selectedUser) return;
    try {
      const res = await api.post('/projects', { userId: selectedUser.id, name, description });
      setProjects(prev => [res.data, ...prev]);
      setSelectedProject(res.data);
      showNotification('Tạo Dự án mới thành công!');
    } catch (e) {
      console.error(e);
      showNotification('Lỗi khi tạo Dự án', 'error');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa Dự án này?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
      setSelectedProject(null);
      showNotification('Đã xóa Dự án thành công');
    } catch (e) {
      showNotification('Lỗi khi xóa Dự án', 'error');
    }
  };

  return (
    <UserContext.Provider value={{
      users, selectedUser, setSelectedUser,
      projects, selectedProject, setSelectedProject,
      handleCreateUser, handleDeleteUser,
      handleCreateProject, handleDeleteProject
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

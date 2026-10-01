import api from '../../services/api';

export const indexingApi = {
  getConfig: (projectId) => api.get(`/indexing/config/${projectId}`),
  saveConfig: (projectId, data) => api.post(`/indexing/config/${projectId}`, data),
  submitUrls: (projectId, data) => api.post(`/indexing/submit/${projectId}`, data),
  getHistory: (projectId) => api.get(`/indexing/history/${projectId}`),
  clearHistory: (projectId) => api.delete(`/indexing/history/${projectId}`)
};

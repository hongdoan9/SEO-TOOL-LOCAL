import api from '../../services/api';

export const socialPbnApi = {
  getSites: (projectId) => api.get(`/social-pbn/sites/${projectId}`),
  addSite: (projectId, siteData) => api.post(`/social-pbn/sites/${projectId}`, siteData),
  deleteSite: (id) => api.delete(`/social-pbn/sites/${id}`),
  testConnection: (siteData) => api.post(`/social-pbn/sites/test-connection`, siteData),
  publishPost: (projectId, postData) => api.post(`/social-pbn/publish/${projectId}`, postData),
  getHistory: (projectId) => api.get(`/social-pbn/history/${projectId}`),
  clearHistory: (projectId) => api.delete(`/social-pbn/history/${projectId}`)
};

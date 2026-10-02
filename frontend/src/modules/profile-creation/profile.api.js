import api from '../../services/api';

// Lấy danh sách Social Schemas
export const getSchemas = async () => {
  const response = await api.get('/profile-creation/schemas');
  return response.data;
};

// Lưu / Cập nhật Social Schema
export const saveSchema = async (schemaData) => {
  const response = await api.post('/profile-creation/schemas', schemaData);
  return response.data;
};

// Nạp danh sách Presets Schemas Mẫu
export const seedPresetSchemas = async () => {
  const response = await api.post('/profile-creation/schemas/seed');
  return response.data;
};

// Lấy danh sách Profiles theo Project
export const getProfiles = async (projectId) => {
  const response = await api.get(`/profile-creation/profiles/${projectId}`);
  return response.data;
};

// Thêm 1 nhiệm vụ Profile mới vào Hàng đợi
export const createProfileTask = async (projectId, platform) => {
  const response = await api.post('/profile-creation/tasks', { projectId, platform });
  return response.data;
};

// Thêm hàng loạt nhiệm vụ Profile
export const bulkCreateProfileTasks = async (projectId, platforms) => {
  const response = await api.post('/profile-creation/tasks/bulk', { projectId, platforms });
  return response.data;
};

// Thử lại Profile task bị thất bại
export const retryProfileTask = async (id) => {
  const response = await api.post('/profile-creation/tasks/retry', { id });
  return response.data;
};

// Gửi trực tiếp URL Profile sang Module 4 Indexing Engine
export const sendProfileToIndexing = async (projectId, urls) => {
  const response = await api.post('/indexing/submit-urls', {
    projectId,
    urls,
    services: ['google', 'bing']
  });
  return response.data;
};

// Xóa Profile task
export const deleteProfileTask = async (id) => {
  const response = await api.delete(`/profile-creation/profiles/${id}`);
  return response.data;
};

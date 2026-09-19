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

// Thêm nhiệm vụ Profile mới vào Hàng đợi
export const createProfileTask = async (projectId, platform) => {
  const response = await api.post('/profile-creation/tasks', { projectId, platform });
  return response.data;
};

// Xóa Profile task
export const deleteProfileTask = async (id) => {
  const response = await api.delete(`/profile-creation/profiles/${id}`);
  return response.data;
};

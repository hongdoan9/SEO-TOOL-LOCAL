import api from '../../services/api';

export const handleCreateGoogleStack = async (projectId, newGoogleStack) => {
  return await api.post(`/google-stacks/${projectId}`, newGoogleStack);
};

export const handleDeleteGoogleStack = async (id) => {
  return await api.delete(`/google-stacks/${id}`);
};

export const handleSaveStackKeywords = async (activeStackId, stackKeywords) => {
  return await api.post(`/google-stacks/keywords/${activeStackId}`, stackKeywords);
};

export const handleSavePrepInfo = async (activeStackId, data) => {
  return await api.post(`/google-stacks/prep-check/${activeStackId}`, data);
};

export const handleCreateAssets = async (activeStackId) => {
  return await api.post(`/google-stacks/queue/${activeStackId}`, { type: 'create_assets', data: {} });
};

export const handleCreateTempTemplates = async (activeStackId) => {
  return await api.post(`/google-stacks/create-temp-templates/${activeStackId}`);
};

export const handleSyncDrive = async (activeStackId) => {
  return await api.post(`/google-stacks/step4/sync-drive/${activeStackId}`);
};

export const handleOptimizeDocs = async (activeStackId, selectedModel) => {
  return await api.post(`/google-stacks/queue/${activeStackId}`, { type: 'optimize_docs', data: { model: selectedModel } });
};

export const handleOptimizePdf = async (activeStackId, selectedModel) => {
  return await api.post(`/google-stacks/optimize-pdf/${activeStackId}`, { model: selectedModel });
};

export const handleOptimizeSheet = async (activeStackId, selectedModel) => {
  return await api.post(`/google-stacks/optimize-sheet/${activeStackId}`, { model: selectedModel });
};

export const handleTranslateKeys = async (activeStackId, selectedModel) => {
  return await api.post(`/google-stacks/queue/${activeStackId}`, { type: 'translate_keys', data: { model: selectedModel } });
};

export const handleCreateLangAssets = async (activeStackId) => {
  return await api.post(`/google-stacks/queue/${activeStackId}`, { type: 'create_lang_assets', data: {} });
};

export const handleOptimizeLangAssets = async (activeStackId, selectedModel, phase) => {
  return await api.post(`/google-stacks/queue/${activeStackId}`, { type: 'optimize_lang_assets', data: { model: selectedModel, phase } });
};

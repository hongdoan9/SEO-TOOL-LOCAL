import React from 'react';
import { Settings, Save, Server, Code } from 'lucide-react';
import { useProjectData } from '../../context/ProjectDataContext';
import { useUser } from '../../context/UserContext';

export default function SettingsModule() {
  const { selectedProject } = useUser();
  const { settings, setSettings, handleSaveSettings } = useProjectData();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSaveSettings(settings);
  };

  if (!selectedProject) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <Settings className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Chưa chọn dự án</h3>
        <p className="text-xs text-slate-400">Vui lòng chọn một Dự án để cài đặt API Keys.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Cài đặt API Keys & Tích hợp</h2>
          <p className="text-xs text-slate-400">Dự án: <span className="text-emerald-400 font-semibold">{selectedProject.name}</span></p>
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Save className="w-4 h-4" /> Lưu Cài đặt
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" /> API Các Mô hình AI (LLMs)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Gemini API Key (Bắt buộc cho Flash 2.5)</label>
            <input
              type="password"
              name="gemini_api_key"
              value={settings.gemini_api_key || ''}
              onChange={handleChange}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">OpenRouter API Key (Claude 3.5, DeepSeek)</label>
            <input
              type="password"
              name="openrouter_api_key"
              value={settings.openrouter_api_key || ''}
              onChange={handleChange}
              placeholder="sk-or-v1-..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Code className="w-4 h-4 text-sky-400" /> Google Cloud Credentials (Để tạo Drive, Docs, Sheets)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Google Client ID</label>
            <input
              type="text"
              name="google_client_id"
              value={settings.google_client_id || ''}
              onChange={handleChange}
              placeholder="xxx.apps.googleusercontent.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Google Client Secret</label>
            <input
              type="password"
              name="google_client_secret"
              value={settings.google_client_secret || ''}
              onChange={handleChange}
              placeholder="GOCSPX-..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>
    </form>
  );
}

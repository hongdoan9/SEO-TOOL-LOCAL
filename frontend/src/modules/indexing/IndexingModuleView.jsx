import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import { indexingApi } from './indexing.api';
import IndexingSubmitSection from './components/IndexingSubmitSection';
import IndexingHistorySection from './components/IndexingHistorySection';
import IndexingConfigSection from './components/IndexingConfigSection';

export default function IndexingModuleView() {
  const { selectedProject } = useUser();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('submit'); // 'submit', 'history', 'config'
  const [config, setConfig] = useState({ googleServiceAccounts: [], bingApiKey: '', bingSiteUrl: '' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedProject?.id) {
      loadConfig();
      loadHistory();
    }
  }, [selectedProject?.id]);

  const loadConfig = async () => {
    if (!selectedProject?.id) return;
    try {
      const res = await indexingApi.getConfig(selectedProject.id);
      setConfig(res.data || { googleServiceAccounts: [], bingApiKey: '', bingSiteUrl: '' });
    } catch (err) {
      console.error('Lỗi khi tải cấu hình Indexing:', err);
    }
  };

  const loadHistory = async () => {
    if (!selectedProject?.id) return;
    try {
      const res = await indexingApi.getHistory(selectedProject.id);
      setHistory(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử Indexing:', err);
    }
  };

  const handleSaveConfig = async (newConfig) => {
    if (!selectedProject?.id) return;
    setLoading(true);
    try {
      await indexingApi.saveConfig(selectedProject.id, newConfig);
      setConfig(newConfig);
      showNotification('Lưu cấu hình Indexing thành công!');
    } catch (err) {
      showNotification('Lỗi khi lưu cấu hình Indexing', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUrls = async (urls, services) => {
    if (!selectedProject?.id) return;
    setLoading(true);
    try {
      const res = await indexingApi.submitUrls(selectedProject.id, { urls, services });
      showNotification(res.data?.message || 'Đã gửi yêu cầu Indexing thành công!');
      loadHistory();
      setActiveTab('history');
    } catch (err) {
      showNotification(err.response?.data?.error || 'Lỗi khi gửi yêu cầu Indexing', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!selectedProject?.id) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử Indexing?')) return;
    setLoading(true);
    try {
      await indexingApi.clearHistory(selectedProject.id);
      setHistory([]);
      showNotification('Đã xóa lịch sử Indexing thành công!');
    } catch (err) {
      showNotification('Lỗi khi xóa lịch sử Indexing', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedProject) {
    return (
      <div className="p-8 text-center text-slate-400">
        Vui lòng chọn một Dự án để sử dụng Module Instant Indexing Engine.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            ⚡ Module 4: Instant Indexing Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ép Google Search Console & Bing Webmaster lập chỉ mục hàng loạt URLs cấp tốc cho Dự án: <span className="text-sky-400 font-semibold">{selectedProject.name}</span>
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-900/80 p-1 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'submit' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🚀 Ép Index URLs
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'history' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📋 Lịch Sử ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'config' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ⚙️ Cấu Hình Keys
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'submit' && (
        <IndexingSubmitSection onSubmit={handleSubmitUrls} loading={loading} />
      )}

      {activeTab === 'history' && (
        <IndexingHistorySection history={history} onClear={handleClearHistory} loading={loading} />
      )}

      {activeTab === 'config' && (
        <IndexingConfigSection config={config} onSave={handleSaveConfig} loading={loading} />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import { socialPbnApi } from './socialPbn.api';
import PostSubmitSection from './components/PostSubmitSection';
import PbnSiteManager from './components/PbnSiteManager';
import PostHistorySection from './components/PostHistorySection';

export default function SocialPbnPosterView() {
  const { selectedProject } = useUser();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('submit'); // 'submit', 'pbn-sites', 'history'
  const [pbnSites, setPbnSites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedProject?.id) {
      loadPbnSites();
      loadHistory();
    }
  }, [selectedProject?.id]);

  const loadPbnSites = async () => {
    if (!selectedProject?.id) return;
    try {
      const res = await socialPbnApi.getSites(selectedProject.id);
      setPbnSites(res.data?.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách PBN sites:', err);
    }
  };

  const loadHistory = async () => {
    if (!selectedProject?.id) return;
    try {
      const res = await socialPbnApi.getHistory(selectedProject.id);
      setHistory(res.data?.data || []);
    } catch (err) {
      console.error('Lỗi tải lịch sử bài đăng:', err);
    }
  };

  const handleAddPbnSite = async (siteData) => {
    if (!selectedProject?.id) return;
    setLoading(true);
    try {
      await socialPbnApi.addSite(selectedProject.id, siteData);
      showNotification('Đã thêm PBN Site thành công!');
      loadPbnSites();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Lỗi khi thêm PBN Site', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPost = async (postPayload) => {
    if (!selectedProject?.id) return;
    setLoading(true);
    try {
      const res = await socialPbnApi.publishPost(selectedProject.id, postPayload);
      showNotification(res.data?.message || 'Đã hoàn tất gửi bài đăng!');
      loadHistory();
      setActiveTab('history');
    } catch (err) {
      showNotification(err.response?.data?.error || 'Lỗi khi xuất bản bài đăng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!selectedProject?.id) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử bài đăng?')) return;
    setLoading(true);
    try {
      await socialPbnApi.clearHistory(selectedProject.id);
      setHistory([]);
      showNotification('Đã xóa toàn bộ lịch sử bài đăng thành công!');
    } catch (err) {
      showNotification('Lỗi khi xóa lịch sử bài đăng', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedProject) {
    return (
      <div className="p-8 text-center text-slate-400">
        Vui lòng chọn một Dự án để sử dụng Module Auto Social & PBN Poster.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header View */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            🌐 Module 5: Auto Social / PBN Poster
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tự động đăng bài & share link lên các trang PBN WordPress vệ tinh và Mạng xã hội cho Dự án: <span className="text-sky-400 font-semibold">{selectedProject.name}</span>
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-900/80 p-1 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'submit' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🚀 Soạn & Đăng Bài
          </button>
          <button
            onClick={() => setActiveTab('pbn-sites')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'pbn-sites' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ⚙️ Quản Lý PBN Sites ({pbnSites.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'history' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📋 Lịch Sử Bài Đăng ({history.length})
          </button>
        </div>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'submit' && (
        <PostSubmitSection
          pbnSites={pbnSites}
          onSubmit={handleSubmitPost}
          loading={loading}
        />
      )}

      {activeTab === 'pbn-sites' && (
        <PbnSiteManager
          sites={pbnSites}
          onRefresh={handleAddPbnSite}
          loading={loading}
        />
      )}

      {activeTab === 'history' && (
        <PostHistorySection
          history={history}
          onClear={handleClearHistory}
          loading={loading}
        />
      )}
    </div>
  );
}

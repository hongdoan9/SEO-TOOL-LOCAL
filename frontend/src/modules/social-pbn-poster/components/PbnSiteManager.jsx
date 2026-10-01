import React, { useState } from 'react';
import { socialPbnApi } from '../socialPbn.api';

export default function PbnSiteManager({ sites, onRefresh, loading }) {
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    if (!siteUrl || !username || !appPassword) {
      alert('Vui lòng nhập URL, Username và App Password trước khi thử kết nối!');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await socialPbnApi.testConnection({ site_url: siteUrl, username, app_password: appPassword });
      setTestResult({ success: true, msg: res.data?.message || 'Kết nối thành công!' });
    } catch (err) {
      setTestResult({ success: false, msg: err.response?.data?.error || 'Lỗi khi kết nối tới PBN Site' });
    } finally {
      setTesting(false);
    }
  };

  const handleAddSite = async (e) => {
    e.preventDefault();
    if (!siteName.trim() || !siteUrl.trim() || !username.trim() || !appPassword.trim()) {
      alert('Vui lòng điền đầy đủ tất cả các trường!');
      return;
    }
    try {
      await onRefresh({ site_name: siteName, site_url: siteUrl, username, app_password: appPassword });
      setSiteName('');
      setSiteUrl('');
      setUsername('');
      setAppPassword('');
      setTestResult(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Thêm PBN Site */}
      <form onSubmit={handleAddSite} className="bg-[#131b2e] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2">
          🌐 Thêm Website PBN WordPress Vệ Tinh Mới
        </h3>
        <p className="text-xs text-slate-400">
          Nhập địa chỉ Website WordPress và Application Password để cho phép công cụ tự động đăng bài qua WP REST API.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Nhận Diện Site (Brand/Tên PBN):</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="VD: PBN Tin Tức Bất Động Sản"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">URL Website WordPress:</label>
            <input
              type="text"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://pbn-blog.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Đăng Nhập (Username/Email):</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin / seo_poster"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Application Password (Mật khẩu ứng dụng):</label>
            <input
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {testResult && (
          <div className={`p-3 rounded-lg text-xs font-medium border ${testResult.success ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
            {testResult.msg}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition disabled:opacity-50"
          >
            {testing ? 'Đang kiểm tra...' : '🔍 Thử Kết Nối REST API'}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-lg transition shadow-md shadow-sky-500/20 disabled:opacity-50"
          >
            + Thêm PBN Site
          </button>
        </div>
      </form>

      {/* Danh sách PBN Sites đã lưu */}
      <div className="bg-[#131b2e] border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center justify-between">
          <span>📋 Danh Sách PBN Sites Đã Lưu ({sites.length})</span>
        </h3>

        {sites.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Chưa có PBN Site nào được cấu hình cho Dự án này. Hãy thêm site mới ở trên!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sites.map((site) => (
              <div key={site.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-100 text-sm">{site.site_name}</h4>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20 rounded">
                      Active
                    </span>
                  </div>
                  <a
                    href={site.site_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-sky-400 hover:underline mt-1 block truncate"
                  >
                    {site.site_url}
                  </a>
                  <div className="text-[11px] text-slate-400 mt-2">
                    User: <span className="text-slate-300 font-mono">{site.username}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-800/80 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Bạn có chắc chắn muốn xóa PBN Site "${site.site_name}"?`)) {
                        socialPbnApi.deleteSite(site.id).then(() => onRefresh());
                      }
                    }}
                    className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs transition"
                  >
                    Xóa Site
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

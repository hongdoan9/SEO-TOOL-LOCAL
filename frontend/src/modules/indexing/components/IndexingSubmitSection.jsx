import React, { useState } from 'react';

export default function IndexingSubmitSection({ onSubmit, loading }) {
  const [urlsText, setUrlsText] = useState('');
  const [useGoogle, setUseGoogle] = useState(true);
  const [useBing, setUseBing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawUrls = urlsText.split('\n').map(u => u.trim()).filter(u => u.startsWith('http://') || u.startsWith('https://'));
    
    if (rawUrls.length === 0) {
      alert('Vui lòng nhập ít nhất 1 URL hợp lệ (bắt đầu bằng http:// hoặc https://).');
      return;
    }

    const services = [];
    if (useGoogle) services.push('google');
    if (useBing) services.push('bing');

    if (services.length === 0) {
      alert('Vui lòng chọn ít nhất 1 công cụ ép Index (Google hoặc Bing).');
      return;
    }

    onSubmit(rawUrls, services);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#131b2e] border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-100 mb-1">🚀 Ép Index Hàng Loạt URLs</h3>
        <p className="text-xs text-slate-400">
          Nhập danh sách đường dẫn cần Google / Bing lập chỉ mục khẩn cấp (Mỗi đường dẫn 1 dòng).
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2">Danh sách URLs:</label>
        <textarea
          rows={8}
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          placeholder="https://docs.google.com/document/d/...&#10;https://medium.com/@brand/my-article&#10;https://mywebsite.com/bai-viet-moi"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed"
        />
        <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
          <span>Tổng số URLs: {urlsText.split('\n').map(u => u.trim()).filter(u => u.length > 0).length}</span>
          <button
            type="button"
            onClick={() => setUrlsText('')}
            className="text-slate-400 hover:text-slate-200 underline"
          >
            Xóa nhanh
          </button>
        </div>
      </div>

      {/* Services Checkboxes */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
        <label className="block text-xs font-semibold text-slate-300 mb-3">Chọn công cụ ép Index:</label>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={useGoogle}
              onChange={(e) => setUseGoogle(e.target.checked)}
              className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-800 border-slate-700"
            />
            <span className="text-sm font-semibold text-sky-400">Google Indexing API</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={useBing}
              onChange={(e) => setUseBing(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700"
            />
            <span className="text-sm font-semibold text-emerald-400">Bing Webmaster API</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-extrabold rounded-xl transition shadow-lg shadow-sky-500/20 disabled:opacity-50"
        >
          {loading ? 'Đang gửi yêu cầu Ép Index...' : 'Gửi Yêu Cầu Ép Index Khẩn Cấp 🚀'}
        </button>
      </div>
    </form>
  );
}

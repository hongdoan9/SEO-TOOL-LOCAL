import React, { useState } from 'react';

const SOCIAL_TARGET_PRESETS = [
  { id: 'medium', name: 'Medium.com', platform: 'medium', type: 'social' },
  { id: 'tumblr', name: 'Tumblr.com', platform: 'tumblr', type: 'social' },
  { id: 'devto', name: 'Dev.to', platform: 'devto', type: 'social' }
];

export default function PostSubmitSection({ pbnSites, onSubmit, loading }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedTargets, setSelectedTargets] = useState([]);

  const toggleTarget = (targetObj) => {
    setSelectedTargets(prev => {
      const exists = prev.some(t => t.id === targetObj.id && t.type === targetObj.type);
      if (exists) {
        return prev.filter(t => !(t.id === targetObj.id && t.type === targetObj.type));
      } else {
        return [...prev, targetObj];
      }
    });
  };

  const selectAllPbn = () => {
    const pbnTargets = pbnSites.map(s => ({ id: s.id, name: s.site_name, type: 'wordpress' }));
    const nonPbnSelected = selectedTargets.filter(t => t.type !== 'wordpress');
    setSelectedTargets([...nonPbnSelected, ...pbnTargets]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Vui lòng nhập đầy đủ Tiêu đề và Nội dung bài viết!');
      return;
    }
    if (selectedTargets.length === 0) {
      alert('Vui lòng chọn ít nhất 1 trang đích (PBN Site hoặc MXH) để xuất bản!');
      return;
    }

    onSubmit({
      title,
      content,
      anchor_text: anchorText.trim(),
      target_url: targetUrl.trim(),
      targets: selectedTargets
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#131b2e] border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-100 mb-1">🚀 Soạn Thảo & Đăng Bài Hàng Loạt</h3>
        <p className="text-xs text-slate-400">
          Soạn bài viết chuẩn SEO, chèn backlink và chọn danh sách PBN / Mạng xã hội để tự động xuất bản.
        </p>
      </div>

      {/* Tiêu đề & Backlink Config */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Tiêu Đề Bài Viết:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề bài viết cuốn hút..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 font-semibold focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Anchor Text (Từ khóa chèn link):</label>
            <input
              type="text"
              value={anchorText}
              onChange={(e) => setAnchorText(e.target.value)}
              placeholder="VD: Dịch vụ SEO Uy Tín"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target URL (Đường dẫn SEO):</label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://mywebsite.com/seo-service"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Nội Dung Bài Viết (Hỗ trợ HTML/Text):</label>
          <textarea
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung bài viết đầy đủ tại đây..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed font-mono"
          />
        </div>
      </div>

      {/* Target Selection Checklist */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-sky-400">
            🎯 Chọn Trang Đích Đăng Bài ({selectedTargets.length} đã chọn):
          </label>
          {pbnSites.length > 0 && (
            <button
              type="button"
              onClick={selectAllPbn}
              className="text-xs text-sky-400 hover:underline"
            >
              Chọn tất cả PBN Sites
            </button>
          )}
        </div>

        {/* Section PBN Sites */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">🌐 WordPress PBN Sites:</div>
          {pbnSites.length === 0 ? (
            <div className="text-xs text-slate-500 italic bg-slate-900/40 p-3 rounded-lg border border-slate-800">
              Chưa có PBN Site nào. Vui lòng sang tab ⚙️ Quản Lý PBN Sites để thêm site!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pbnSites.map(site => {
                const isSelected = selectedTargets.some(t => t.id === site.id && t.type === 'wordpress');
                return (
                  <label
                    key={site.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${isSelected ? 'bg-sky-500/10 border-sky-500 text-sky-300' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTarget({ id: site.id, name: site.site_name, type: 'wordpress' })}
                      className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-800 border-slate-700"
                    />
                    <div className="truncate">
                      <div className="font-semibold text-xs truncate">{site.site_name}</div>
                      <div className="text-[10px] opacity-70 truncate">{site.site_url}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Section Social Extensions */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">📱 Social Networks & Web 2.0 (Extension Agent):</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SOCIAL_TARGET_PRESETS.map(social => {
              const isSelected = selectedTargets.some(t => t.id === social.id && t.type === 'social');
              return (
                <label
                  key={social.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${isSelected ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTarget(social)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700"
                  />
                  <div className="font-semibold text-xs">{social.name}</div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-extrabold rounded-xl transition shadow-lg shadow-sky-500/20 disabled:opacity-50"
        >
          {loading ? 'Đang Xuất Bản Bài Đăng...' : '🚀 Bắt Đầu Đăng Bài Hàng Loạt'}
        </button>
      </div>
    </form>
  );
}

import React, { useState } from 'react';

export default function IndexingConfigSection({ config, onSave, loading }) {
  const [googleKeys, setGoogleKeys] = useState(config.googleServiceAccounts || []);
  const [bingKey, setBingKey] = useState(config.bingApiKey || '');
  const [bingUrl, setBingUrl] = useState(config.bingSiteUrl || '');
  const [jsonText, setJsonText] = useState('');

  const handleAddJson = () => {
    if (!jsonText.trim()) return;
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.client_email || !parsed.private_key) {
        alert('File JSON không hợp lệ! Thiếu client_email hoặc private_key.');
        return;
      }
      setGoogleKeys(prev => [...prev, parsed]);
      setJsonText('');
    } catch (e) {
      alert('Định dạng JSON không hợp lệ!');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.client_email || !parsed.private_key) {
          alert('File JSON không hợp lệ! Thiếu client_email hoặc private_key.');
          return;
        }
        setGoogleKeys(prev => [...prev, parsed]);
      } catch (err) {
        alert('Lỗi đọc file JSON!');
      }
    };
    reader.readAsText(file);
  };

  const handleRemoveKey = (index) => {
    setGoogleKeys(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      googleServiceAccounts: googleKeys,
      bingApiKey: bingKey,
      bingSiteUrl: bingUrl
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Google Indexing API Config */}
      <div className="bg-[#131b2e] border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-lg font-bold text-sky-400 mb-2 flex items-center gap-2">
          🔑 Google Service Account Keys ({googleKeys.length})
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Tải lên file JSON Service Account từ Google Cloud Console để cho phép gửi yêu cầu Indexing (Mỗi key tối đa 200 URLs/ngày).
        </p>

        {googleKeys.length > 0 && (
          <div className="space-y-2 mb-4">
            {googleKeys.map((keyObj, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/80 border border-slate-700/50 p-3 rounded-lg text-sm">
                <div>
                  <div className="font-semibold text-slate-200">{keyObj.client_email}</div>
                  <div className="text-xs text-slate-500 font-mono">Project ID: {keyObj.project_id || 'N/A'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveKey(idx)}
                  className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded hover:bg-rose-500/30 text-xs transition"
                >
                  Xóa Key
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">Thêm Key mới bằng Upload File JSON:</label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20 cursor-pointer"
          />

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Hoặc dán trực tiếp nội dung JSON:</label>
            <textarea
              rows={3}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='Dán nội dung {"type": "service_account", ...} vào đây'
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={handleAddJson}
              className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
            >
              + Thêm Key từ Text
            </button>
          </div>
        </div>
      </div>

      {/* Bing Webmaster API Config */}
      <div className="bg-[#131b2e] border border-slate-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-lg font-bold text-emerald-400 mb-2 flex items-center gap-2">
          🌐 Bing Webmaster API Config
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Cấu hình Bing API Key từ Bing Webmaster Tools để submit danh sách URLs hàng loạt lên Bing Search Engine.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bing API Key:</label>
            <input
              type="text"
              value={bingKey}
              onChange={(e) => setBingKey(e.target.value)}
              placeholder="Nhập Bing Webmaster API Key"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Domain đăng ký trên Bing (Site URL):</label>
            <input
              type="text"
              value={bingUrl}
              onChange={(e) => setBingUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition shadow-lg shadow-sky-500/20 disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : 'Lưu Cấu Hình Indexing'}
        </button>
      </div>
    </form>
  );
}

import React from 'react';
import { useNotification } from '../../../context/NotificationContext';

export default function PostHistorySection({ history, onClear, loading }) {
  const { showNotification } = useNotification();

  const handleCopy = (text, msg) => {
    navigator.clipboard.writeText(text);
    showNotification(msg || 'Đã sao chép vào bộ nhớ tạm!');
  };

  const handleCopyAllLinks = () => {
    const validLinks = history.filter(item => item.post_url).map(item => item.post_url).join('\n');
    if (!validLinks) {
      showNotification('Không có đường dẫn bài viết nào để sao chép!', 'error');
      return;
    }
    handleCopy(validLinks, `Đã sao chép ${history.filter(item => item.post_url).length} link bài viết!`);
  };

  return (
    <div className="bg-[#131b2e] border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            📋 Lịch Sử Đăng Bài & Link Output ({history.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Danh sách các bài viết đã xuất bản thành công hoặc đang chờ xử lý.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleCopyAllLinks}
                className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-semibold transition"
              >
                📋 Copy Tất Cả Link Bài Đăng
              </button>
              <button
                type="button"
                onClick={onClear}
                disabled={loading}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                🗑️ Xóa Lịch Sử
              </button>
            </>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs">
          Chưa có bài viết nào được xuất bản. Hãy soạn bài và chọn trang đích ở Tab 🚀 Soạn & Đăng Bài!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <th className="p-3 font-semibold">STT</th>
                <th className="p-3 font-semibold">Trang Đích (Target)</th>
                <th className="p-3 font-semibold">Tiêu Đề Bài Viết</th>
                <th className="p-3 font-semibold">Trạng Thái</th>
                <th className="p-3 font-semibold">Link Bài Viết (Output URL)</th>
                <th className="p-3 font-semibold">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {history.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-900/40 transition">
                  <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-200">{item.target_name}</span>
                    <span className="ml-2 px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.target_type === 'wordpress' ? 'PBN WP' : 'Social'}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-100 max-w-xs truncate">{item.post_title}</td>
                  <td className="p-3">
                    {item.status === 'completed' && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px] font-semibold">
                        Thành công
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[11px] font-semibold">
                        Đang chờ Extension
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[11px] font-semibold" title={item.error_message}>
                        Thất bại
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {item.post_url ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={item.post_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-400 hover:underline truncate max-w-xs block font-mono text-[11px]"
                        >
                          {item.post_url}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.post_url, 'Đã copy link bài viết!')}
                          className="text-slate-400 hover:text-slate-200 text-xs"
                          title="Copy Link"
                        >
                          📋
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">
                        {item.error_message || 'Chưa có link'}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-[11px] text-slate-400 font-mono">
                    {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

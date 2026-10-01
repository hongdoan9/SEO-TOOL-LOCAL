import React from 'react';

export default function IndexingHistorySection({ history, onClear, loading }) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-[#131b2e] border border-slate-800 rounded-xl p-12 text-center">
        <p className="text-slate-400 text-sm">Chưa có lịch sử submit Indexing nào trong Dự án này.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#131b2e] border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-100">📋 Lịch Sử Submit Indexing</h3>
        <button
          onClick={onClear}
          disabled={loading}
          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium transition"
        >
          Xóa Lịch Sử
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">STT</th>
              <th className="py-3 px-4">URL</th>
              <th className="py-3 px-4">Công cụ</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4">Thông báo</th>
              <th className="py-3 px-4">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {history.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-900/40">
                <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                <td className="py-3 px-4 font-sans max-w-xs truncate">
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                    {item.url}
                  </a>
                </td>
                <td className="py-3 px-4 uppercase font-bold text-slate-300">{item.service}</td>
                <td className="py-3 px-4">
                  {item.status === 'success' ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      SUCCESS
                    </span>
                  ) : item.status === 'failed' ? (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                      FAILED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                      PENDING
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">{item.response_msg}</td>
                <td className="py-3 px-4 text-slate-500 text-[10px]">
                  {item.submitted_at ? new Date(item.submitted_at).toLocaleString('vi-VN') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

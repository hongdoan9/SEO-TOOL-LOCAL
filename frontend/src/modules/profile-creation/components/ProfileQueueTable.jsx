import React, { useState } from 'react';
import { Play, Trash2, ExternalLink, RefreshCw, CheckCircle, Clock, AlertCircle, Sparkles, Download } from 'lucide-react';

export default function ProfileQueueTable({
  profiles,
  schemas,
  onCreateTask,
  onDeleteTask,
  onRefresh,
  onSeedPresets,
  onOpenExport,
  loading
}) {
  const [selectedPlatform, setSelectedPlatform] = useState('');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" /> Hoàn thành
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang chạy...
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Thất bại
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Đang chờ
          </span>
        );
    }
  };

  const handleCreateSelected = () => {
    if (selectedPlatform) {
      onCreateTask(selectedPlatform);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Hàng Đợi Tạo Profile Social</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-sky-400 font-bold border border-slate-700">
              {profiles.length} Task
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Extension sẽ tự động lấy các task "Đang chờ" để thực thi theo thứ tự.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onSeedPresets}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-xs font-bold transition-all"
            title="Nạp cấu hình mẫu cho Medium, Reddit, Quora, Pinterest..."
          >
            <Sparkles className="w-4 h-4" /> Nạp Schemas Mẫu
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all"
          >
            <Download className="w-4 h-4" /> Xuất Links ({profiles.filter(p => p.status === 'completed').length})
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Quick Task Creation Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
            >
              <option value="">-- Chọn Nền Tảng --</option>
              {schemas.map((s) => (
                <option key={s.platform} value={s.platform}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateSelected}
              disabled={!selectedPlatform}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Tạo Task
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 px-4">Platform</th>
              <th className="pb-3 px-4">Trạng thái</th>
              <th className="pb-3 px-4">Profile Link</th>
              <th className="pb-3 px-4">Ngày tạo</th>
              <th className="pb-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                  Chưa có nhiệm vụ tạo Profile nào trong hàng đợi. Nhấp "Nạp Schemas Mẫu" và chọn Nền tảng để bắt đầu!
                </td>
              </tr>
            ) : (
              profiles.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-all">
                  <td className="py-4 px-4 font-bold text-white uppercase text-xs">
                    {p.platform}
                  </td>
                  <td className="py-4 px-4">{getStatusBadge(p.status)}</td>
                  <td className="py-4 px-4">
                    {p.profile_url ? (
                      <a
                        href={p.profile_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sky-400 hover:underline text-xs"
                      >
                        {p.profile_url} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-slate-400 text-xs">
                    {new Date(p.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => onDeleteTask(p.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


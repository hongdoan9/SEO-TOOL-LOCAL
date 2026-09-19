import React from 'react';
import { Layers, Plus, Building2, Phone, Globe, Trash2, Link as LinkIcon, ArrowRight } from 'lucide-react';
import { useProjectData } from '../../../context/ProjectDataContext';
import { useUser } from '../../../context/UserContext';
import { useStack } from '../stack.context';
import { handleDeleteGoogleStack } from '../stack.api';
import { useNotification } from '../../../context/NotificationContext';

export default function StackOverview({ onOpenCreateModal }) {
  const { selectedProject } = useUser();
  const { businessInfo: safeBiz, googleStacks: safeStacks, fetchGoogleStacks } = useProjectData();
  const { setActiveStackId } = useStack();
  const { showNotification } = useNotification();

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa Google Stack này?')) return;
    try {
      await handleDeleteGoogleStack(id);
      showNotification('Đã xóa Google Stack thành công');
      fetchGoogleStacks(selectedProject.id);
    } catch (e) {
      showNotification('Lỗi khi xóa Google Stack', 'error');
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" /> Module 2 • Google Entity Engine
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Tổng quan các bộ Google Entity Stack
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dự án hiện tại: <span className="text-emerald-400 font-bold">{selectedProject.name}</span>
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 font-bold" /> Tạo Bộ Google Stack Mới
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 font-medium block">Brand liên kết từ Module 1</span>
            <span className="text-xs font-bold text-white truncate block">
              {safeBiz.brand || safeBiz.company_name || 'Chưa nhập ở Module 1'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 font-medium block">SĐT Hotline tự động</span>
            <span className="text-xs font-bold text-white truncate block">
              {(Array.isArray(safeBiz.phones) && safeBiz.phones[0]) || 'Chưa nhập ở Module 1'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 font-medium block">Website dự án</span>
            <span className="text-xs font-bold text-white truncate block">
              {safeBiz.website || 'Chưa nhập ở Module 1'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Danh sách Các bộ Google Stack đã khởi tạo ({safeStacks.length})</span>
        </h3>

        {safeStacks.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-bold text-white">Chưa có bộ Google Stack nào</h4>
              <p className="text-xs text-slate-400">
                Dự án này chưa khởi tạo bộ Google Stack nào. Nhấn nút dưới đây để tạo bộ mới với thông tin tự động liên kết từ Module 1!
              </p>
            </div>
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl"
            >
              <Plus className="w-4 h-4" /> Tạo Bộ Google Stack Đầu Tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeStacks.map(stack => (
              <div
                key={stack.id}
                className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 space-y-4 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                      Stack #{stack.id}
                    </span>
                    <button
                      onClick={() => handleDelete(stack.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Xóa bộ Stack này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-base font-bold text-white truncate">{stack.brand || stack.main_key}</h4>
                  <p className="text-xs text-slate-400 font-medium truncate">
                    Key chính: <span className="text-slate-200">{stack.main_key}</span>
                  </p>

                  <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{stack.url}</span>
                    </div>
                    {stack.phone && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{stack.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <a
                    href={stack.drive_folder}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-400 font-medium"
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> Mở Drive Folder
                  </a>

                  <button
                    onClick={() => setActiveStackId(stack.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-sky-500/10 transition-colors"
                  >
                    ⚙️ Vận hành Stack <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

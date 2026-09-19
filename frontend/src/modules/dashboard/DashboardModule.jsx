import React from 'react';
import { Home, Layers, Building2, User } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useProjectData } from '../../context/ProjectDataContext';

export default function DashboardModule() {
  const { selectedUser, selectedProject, projects } = useUser();
  const { googleStacks } = useProjectData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Home className="w-6 h-6 text-emerald-400" />
          Dashboard Tổng quan
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Xin chào, <span className="text-white font-semibold">{selectedUser?.name || 'Khách'}</span>!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Dự án của bạn</p>
            <h3 className="text-2xl font-bold text-white">{projects.length}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Dự án đang chọn</p>
            <h3 className="text-lg font-bold text-white truncate max-w-[150px]">
              {selectedProject?.name || 'Chưa chọn'}
            </h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Google Stacks (Dự án này)</p>
            <h3 className="text-2xl font-bold text-white">{googleStacks.length}</h3>
          </div>
        </div>
      </div>

      {!selectedProject && (
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-6 text-sky-400 text-sm">
          💡 Vui lòng tạo User và Dự án ở thanh menu trên cùng, sau đó chọn một Dự án để bắt đầu sử dụng các Module.
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { LayoutDashboard, Building2, Layers, Settings, Zap, UserPlus } from 'lucide-react';

export default function Sidebar({ isOpen, activeModule, setActiveModule }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { id: 'business-info', label: 'Module 1: Thông tin Doanh nghiệp', icon: <Building2 className="w-5 h-5 text-emerald-400" /> },
    { id: 'google-stack', label: 'Module 2: Google Entity Stacks', icon: <Layers className="w-5 h-5 text-sky-400" /> },
    { id: 'profile-creation', label: 'Module 3: Tạo Profile Social', icon: <UserPlus className="w-5 h-5 text-indigo-400" /> },
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64' : 'w-0 opacity-0 overflow-hidden'
      }`}
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 text-white font-black tracking-tight">
          <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400" />
          <span className="text-lg">SEO Tool</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Menu Điều Hướng
        </div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeModule === item.id
                ? 'bg-sky-500/10 text-sky-400 shadow-sm shadow-sky-500/5'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Admin User</p>
            <p className="text-[10px] text-slate-400 truncate">Sẵn sàng</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

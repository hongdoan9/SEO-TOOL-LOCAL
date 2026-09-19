import React from 'react';
import { Building2, Save } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useProjectData } from '../../context/ProjectDataContext';
import BusinessFields from './components/BusinessFields';
import BusinessDynamicLists from './components/BusinessDynamicLists';

export default function BusinessInfoView() {
  const { selectedProject } = useUser();
  const { businessInfo, setBusinessInfo, handleSaveBusinessInfo } = useProjectData();

  if (!selectedProject) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <Building2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Chưa chọn dự án</h3>
        <p className="text-xs text-slate-400">Vui lòng chọn một Dự án để nhập Thông tin Doanh nghiệp.</p>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSaveBusinessInfo(businessInfo);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Thông tin Doanh nghiệp (Entity NAP)</h2>
          <p className="text-xs text-slate-400">Đang chỉnh sửa cho dự án: <span className="text-emerald-400 font-semibold">{selectedProject.name}</span></p>
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Save className="w-4 h-4" /> Lưu thông tin Doanh nghiệp
        </button>
      </div>

      <BusinessFields businessInfo={businessInfo} setBusinessInfo={setBusinessInfo} />
      <BusinessDynamicLists businessInfo={businessInfo} setBusinessInfo={setBusinessInfo} />
    </form>
  );
}

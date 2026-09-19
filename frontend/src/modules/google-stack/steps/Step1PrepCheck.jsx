import React, { useEffect } from 'react';
import { Save } from 'lucide-react';
import { useStack } from '../stack.context';
import { handleSavePrepInfo } from '../stack.api';
import { useNotification } from '../../../context/NotificationContext';
import { useProjectData } from '../../../context/ProjectDataContext';
import { useUser } from '../../../context/UserContext';
import PrepImageUpload from '../components/PrepImageUpload';

export default function Step1PrepCheck() {
  const { 
    activeStackId, prepChecks, prepBrand, setPrepBrand, 
    prepPhone, setPrepPhone, prepAddress, setPrepAddress, 
    prepMapUrl, setPrepMapUrl, manualVideoDone 
  } = useStack();
  
  const { showNotification } = useNotification();
  const { businessInfo, fetchGoogleStacks } = useProjectData();
  const { selectedProject } = useUser();

  // Auto pick Google Map URL from Module 1 branch addresses (addresses[0].map_url) if prepMapUrl is empty
  useEffect(() => {
    if (!prepMapUrl && businessInfo?.addresses?.length > 0) {
      const firstMapUrl = businessInfo.addresses.find(a => a?.map_url && a.map_url.trim() !== '')?.map_url;
      if (firstMapUrl) {
        setPrepMapUrl(firstMapUrl);
      }
    }
  }, [businessInfo, prepMapUrl, setPrepMapUrl]);

  const onSave = async () => {
    if (!activeStackId) return;
    try {
      await handleSavePrepInfo(activeStackId, {
        checks: prepChecks, brand: prepBrand, phone: prepPhone, 
        address: prepAddress, mapUrl: prepMapUrl, manualVideoDone
      });
      showNotification('Đã lưu thông tin chuẩn bị!');
      if (selectedProject) fetchGoogleStacks(selectedProject.id);
    } catch (e) {
      showNotification('Lỗi khi lưu thông tin chuẩn bị', 'error');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">Kiểm tra & Chuẩn bị Thông tin Thấu đáo</h3>
          <p className="text-[11px] text-emerald-400 font-medium">✨ Tự động liên kết Brand, Phone, Address, Google Map URL từ Module 1</p>
        </div>
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          <Save className="w-4 h-4" /> Lưu thông tin Chuẩn bị
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Tên Thương hiệu (Brand)</label>
          <input
            type="text"
            value={prepBrand || ''}
            onChange={(e) => setPrepBrand(e.target.value)}
            placeholder="Tên thương hiệu..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Số điện thoại Phone</label>
          <input
            type="text"
            value={prepPhone || ''}
            onChange={(e) => setPrepPhone(e.target.value)}
            placeholder="Số điện thoại..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Địa chỉ doanh nghiệp</label>
          <input
            type="text"
            value={prepAddress || ''}
            onChange={(e) => setPrepAddress(e.target.value)}
            placeholder="Địa chỉ doanh nghiệp..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Google Map URL</span>
            {businessInfo?.addresses?.length > 1 && (
              <span className="text-[10px] text-sky-400 font-mono">(Có {businessInfo.addresses.length} địa chỉ)</span>
            )}
          </label>
          <input
            type="text"
            value={prepMapUrl || ''}
            onChange={(e) => setPrepMapUrl(e.target.value)}
            placeholder="https://maps.google.com/..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      <PrepImageUpload />
    </div>
  );
}

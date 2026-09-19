import React from 'react';
import { Save } from 'lucide-react';
import { KEYWORD_FIELDS } from '../../../constants/keywordFields';
import { useStack } from '../stack.context';
import { handleSaveStackKeywords } from '../stack.api';
import { useNotification } from '../../../context/NotificationContext';
import { useProjectData } from '../../../context/ProjectDataContext';
import { useUser } from '../../../context/UserContext';

export default function Step2Keywords() {
  const { 
    activeStackId, stackKeywords, setStackKeywords,
    bulkText1, setBulkText1, bulkText2, setBulkText2,
    bulkText3, setBulkText3, bulkText4, setBulkText4 
  } = useStack();
  
  const { showNotification } = useNotification();
  const { fetchGoogleStacks } = useProjectData();
  const { selectedProject } = useUser();

  const handleKeywordChange = (key, value) => {
    setStackKeywords(prev => ({ ...prev, [key]: value }));
  };

  const onBulkApply = () => {
    const updated = { ...stackKeywords };
    const p1 = bulkText1.split('\n').map(s => s.trim()).filter(Boolean);
    if (p1[0]) updated.key_chinh_local = p1[0];
    if (p1[1]) updated.lsi_local = p1[1];

    const p2 = bulkText2.split('\n').map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < 4; i++) { if (p2[i]) updated[`lsi_${i + 1}`] = p2[i]; }

    const p3 = bulkText3.split('\n').map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < 6; i++) { if (p3[i]) updated[`cluster_${i + 1}`] = p3[i]; }

    const p4 = bulkText4.split('\n').map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < 37; i++) { if (p4[i]) updated[`lsi_${i + 5}`] = p4[i]; }

    setStackKeywords(updated);
    showNotification('Đã phân bổ từ khóa hàng loạt!');
  };

  const onSave = async () => {
    if (!activeStackId) return;
    try {
      await handleSaveStackKeywords(activeStackId, stackKeywords);
      showNotification('Đã lưu bảng từ khóa Stack!');
      if (selectedProject) fetchGoogleStacks(selectedProject.id);
    } catch (e) {
      showNotification('Lỗi khi lưu từ khóa', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Nhập Từ Khóa Hàng Loạt (Bulk Paste)</h3>
          <button
            onClick={onBulkApply}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
          >
            Áp dụng Hàng loạt
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Nhóm 1 (Local Keys - 2 dòng)</label>
            <textarea
              rows={3}
              value={bulkText1 || ''}
              onChange={(e) => setBulkText1(e.target.value)}
              placeholder="Line 1: Key chính + Local&#10;Line 2: LSI + Local"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 resize-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Nhóm 2 (LSI 1-4 - 4 dòng)</label>
            <textarea
              rows={3}
              value={bulkText2 || ''}
              onChange={(e) => setBulkText2(e.target.value)}
              placeholder="Paste 4 dòng LSI 1..4..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 resize-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Nhóm 3 (Cluster 1-6 - 6 dòng)</label>
            <textarea
              rows={3}
              value={bulkText3 || ''}
              onChange={(e) => setBulkText3(e.target.value)}
              placeholder="Paste 6 dòng Cluster 1..6..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 resize-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Nhóm 4 (LSI 5-41 - 37 dòng)</label>
            <textarea
              rows={3}
              value={bulkText4 || ''}
              onChange={(e) => setBulkText4(e.target.value)}
              placeholder="Paste 37 dòng LSI 5..41..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Danh sách 39 Từ khóa Chi tiết</h3>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl"
          >
            <Save className="w-4 h-4" /> Lưu Từ Khoá Stack
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2">
          {KEYWORD_FIELDS.map(f => (
            <div key={f.key} className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 space-y-1">
              <label className="block text-[11px] text-sky-400 font-semibold truncate">{f.label}</label>
              <input
                type="text"
                value={stackKeywords[f.key] || ''}
                onChange={(e) => handleKeywordChange(f.key, e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

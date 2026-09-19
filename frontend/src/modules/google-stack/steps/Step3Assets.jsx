import React, { useState } from 'react';
import { Globe, Sparkles, Activity, ExternalLink, FolderPlus } from 'lucide-react';
import { useStack } from '../stack.context';
import { useProjectData } from '../../../context/ProjectDataContext';
import { useUser } from '../../../context/UserContext';
import { handleCreateAssets, handleSyncDrive, handleCreateTempTemplates } from '../stack.api';
import { useNotification } from '../../../context/NotificationContext';

import SyncedDriveLinksTable from '../components/SyncedDriveLinksTable';

const TYPE_BADGES = {
  document: { label: 'Docs', cls: 'bg-sky-500/20 text-sky-400' },
  spreadsheet: { label: 'Sheet', cls: 'bg-emerald-500/20 text-emerald-400' },
  presentation: { label: 'Slide', cls: 'bg-amber-500/20 text-amber-400' },
  form: { label: 'Form', cls: 'bg-purple-500/20 text-purple-400' },
  drawing: { label: 'Drawing', cls: 'bg-pink-500/20 text-pink-400' },
};

export default function Step3Assets() {
  const { googleConnected, handleConnectGoogle, fetchGoogleStacks } = useProjectData();
  const { selectedProject } = useUser();
  const { 
    activeStackId, selectedStack, creatingAssets, setCreatingAssets, 
    assetCreationProgress, setAssetCreationProgress,
    syncingDrive, setSyncingDrive, syncProgress, setSyncProgress,
    setActiveJobId
  } = useStack();
  
  const { showNotification } = useNotification();
  const [creatingTemplates, setCreatingTemplates] = useState(false);

  const assets = React.useMemo(() => {
    if (!selectedStack?.assets) return [];
    const raw = typeof selectedStack.assets === 'string' ? JSON.parse(selectedStack.assets) : selectedStack.assets;
    return Array.isArray(raw) ? raw : [];
  }, [selectedStack?.assets]);

  const onCreateAssets = async () => {
    if (!activeStackId) return;
    setCreatingAssets(true);
    setAssetCreationProgress('Đang tự động tạo Drive, Sheets, Docs...');
    try {
      const res = await handleCreateAssets(activeStackId);
      if (res.data?.jobId) setActiveJobId(res.data.jobId);
      showNotification('Tiến trình tạo tài sản đã được đưa vào chạy nền (Queue)!');
    } catch (e) {
      showNotification(e.response?.data?.error || 'Lỗi khi tạo tài sản Google', 'error');
    } finally {
      setCreatingAssets(false);
      setAssetCreationProgress('');
    }
  };

  const onCreateTempTemplates = async () => {
    if (!activeStackId) return;
    setCreatingTemplates(true);
    try {
      await handleCreateTempTemplates(activeStackId);
      showNotification('Đã tạo 10 tệp Docs dự trữ (Templates LSI 5-14) thành công!');
      fetchGoogleStacks(selectedProject.id);
    } catch (e) {
      showNotification(e.response?.data?.error || 'Lỗi khi tạo phiên bản docs dự trữ', 'error');
    } finally {
      setCreatingTemplates(false);
    }
  };

  const onSyncDrive = async () => {
    if (!activeStackId) return;
    setSyncingDrive(true);
    setSyncProgress('Đang quét và đồng bộ dữ liệu thư mục Google Drive...');
    try {
      await handleSyncDrive(activeStackId);
      showNotification('Đồng bộ dữ liệu Drive thành công!');
      fetchGoogleStacks(selectedProject.id);
    } catch (e) {
      showNotification('Lỗi khi đồng bộ Drive', 'error');
    } finally {
      setSyncingDrive(false);
      setSyncProgress('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Tạo Thư mục & Tài sản Google Entity</h3>
            <p className="text-xs text-slate-400">Yêu cầu xác thực tài khoản Google Cloud OAuth để tạo tự động.</p>
          </div>
          <button
            onClick={handleConnectGoogle}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              googleConnected 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            <Globe className="w-4 h-4" /> {googleConnected ? 'Đã kết nối Google OAuth' : 'Kết nối Google Cloud'}
          </button>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center gap-4 flex-wrap">
          <button
            onClick={onCreateAssets}
            disabled={creatingAssets || !googleConnected}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
          >
            <Sparkles className="w-4 h-4" /> {creatingAssets ? 'Đang tạo Assets...' : 'Tự động Tạo Drive, Sheet, Docs Assets'}
          </button>

          <button
            onClick={onCreateTempTemplates}
            disabled={creatingTemplates || !googleConnected || assets.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 transition-all"
          >
            <FolderPlus className="w-4 h-4" /> {creatingTemplates ? 'Đang tạo Templates...' : 'Tạo phiên bản docs dự trữ'}
          </button>

          <button
            onClick={onSyncDrive}
            disabled={syncingDrive || !googleConnected}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs rounded-xl transition-all"
          >
            <Activity className="w-4 h-4 text-sky-400" /> {syncingDrive ? 'Đang đồng bộ...' : 'Đồng bộ Thư mục Drive'}
          </button>

          {assetCreationProgress && (
            <span className="text-xs text-sky-400 font-medium animate-pulse">{assetCreationProgress}</span>
          )}
          {syncProgress && (
            <span className="text-xs text-emerald-400 font-medium animate-pulse">{syncProgress}</span>
          )}
        </div>
      </div>

      {/* Bảng thông tin Assets đã tạo */}
      {assets.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-white">
              📋 Danh sách Assets đã tạo <span className="text-sky-400">({assets.length})</span>
            </h3>
            <span className="text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-900/50 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
              ✨ Hàng nổi bật: LSI keywords 5 → 14
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2.5 px-3 text-slate-400 font-semibold w-12">STT</th>
                  <th className="text-left py-2.5 px-3 text-slate-400 font-semibold">Key</th>
                  <th className="text-left py-2.5 px-3 text-slate-400 font-semibold w-20">Loại</th>
                  <th className="text-left py-2.5 px-3 text-slate-400 font-semibold">Link Assets</th>
                  <th className="text-left py-2.5 px-3 text-slate-400 font-semibold">Link Publish</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, idx) => {
                  const badge = TYPE_BADGES[asset.type] || TYPE_BADGES.document;
                  const isSpecialLsi = ['lsi_5', 'lsi_6', 'lsi_7', 'lsi_8', 'lsi_9', 'lsi_10', 'lsi_11', 'lsi_12', 'lsi_13', 'lsi_14'].includes(asset.keyField);
                  return (
                    <tr 
                      key={asset.keyField || idx} 
                      className={
                        isSpecialLsi
                          ? "border-b border-amber-900/40 bg-amber-950/25 hover:bg-amber-900/35 border-l-2 border-l-amber-400 transition-colors"
                          : "border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      }
                    >
                      <td className={`py-2 px-3 font-mono ${isSpecialLsi ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                        {idx + 1}
                      </td>
                      <td className={`py-2 px-3 font-medium ${isSpecialLsi ? 'text-amber-200' : 'text-slate-200'}`}>
                        <div className="flex items-center gap-1.5">
                          <span>{asset.title || asset.keyLabel}</span>
                          {isSpecialLsi && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                              LSI 5-14
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="py-2 px-3">
                        {asset.driveUrl ? (
                          <a href={asset.driveUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline underline-offset-2 truncate max-w-[280px]">
                            <ExternalLink className="w-3 h-3 shrink-0" /> Mở trên Drive
                          </a>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-2 px-3">
                        {asset.pubUrl && asset.pubUrl !== asset.driveUrl ? (
                          <a href={asset.pubUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline underline-offset-2 truncate max-w-[280px]">
                            <ExternalLink className="w-3 h-3 shrink-0" /> Xem Published
                          </a>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bảng tổng hợp các link sau khi đã click Đồng bộ Thư mục Drive */}
      <SyncedDriveLinksTable />
    </div>
  );
}

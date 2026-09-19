import React from 'react';
import { Folder, FileSpreadsheet, Image as ImageIcon, ExternalLink, Info } from 'lucide-react';
import { useStack } from '../stack.context';

export default function SyncedDriveLinksTable() {
  const { selectedStack, step4Images, stackKeywords } = useStack();

  if (!selectedStack) return null;

  const sheetUrl = selectedStack.sheet_created_url || selectedStack.sheet_url || '';
  const imageFolderUrl = selectedStack.image_folder_url || '';
  const mainKey = selectedStack.main_key || 'Stack';

  const languagesData = selectedStack.languages_data
    ? (typeof selectedStack.languages_data === 'string' ? JSON.parse(selectedStack.languages_data) : selectedStack.languages_data)
    : {};
  const tempFolderUrl = languagesData.temp_folder_url || '';

  // Parse step4Images
  const rawImages = step4Images?.length > 0 
    ? step4Images 
    : (selectedStack.step4_images 
        ? (typeof selectedStack.step4_images === 'string' ? JSON.parse(selectedStack.step4_images) : selectedStack.step4_images) 
        : []);

  const syncedImages = (rawImages || []).filter(img => img?.driveUrl);

  const hasAnySyncedLink = Boolean(sheetUrl || imageFolderUrl || tempFolderUrl || syncedImages.length > 0);

  if (!hasAnySyncedLink) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          📁 Tổng hợp Link đã Đồng bộ Google Drive & Templates
        </h3>
        <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-lg">
          ✨ Đã đồng bộ lên Cloud
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Google Sheet Tổng */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Google Sheet đại diện Stack
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold">Spreadsheet</span>
          </div>
          <p className="text-xs text-slate-400 truncate" title={mainKey}>{mainKey}</p>
          {sheetUrl ? (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Mở Google Sheet
            </a>
          ) : (
            <span className="text-xs text-slate-600 italic">Chưa đồng bộ Sheet</span>
          )}
        </div>

        {/* Card 2: Drive Folder 12 Ảnh */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Folder className="w-4 h-4 text-amber-400" />
              Drive Folder 12 Image
            </span>
            <span className="text-[10px] text-amber-400 font-mono font-semibold">Folder</span>
          </div>
          <p className="text-xs text-slate-400 truncate" title={`${mainKey} - Image folder`}>
            {mainKey} - Image folder
          </p>
          {imageFolderUrl ? (
            <a
              href={imageFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Mở Folder 12 Image
            </a>
          ) : (
            <span className="text-xs text-slate-600 italic">Chưa tạo Folder Image</span>
          )}
        </div>

        {/* Card 3: Drive Folder Docs Dự trữ (Templates) */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Folder className="w-4 h-4 text-purple-400" />
              Docs Dự trữ (Templates)
            </span>
            <span className="text-[10px] text-purple-400 font-mono font-semibold">LSI 5-14</span>
          </div>
          <p className="text-xs text-slate-400 truncate" title="10 tệp đệm Docs làm sạch">
            Templates (10 tệp Docs dự trữ)
          </p>
          {tempFolderUrl ? (
            <a
              href={tempFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Mở Folder Templates
            </a>
          ) : (
            <span className="text-xs text-slate-600 italic">Chưa tạo Docs dự trữ</span>
          )}
        </div>
      </div>

      {/* Bảng 12 Link Image Drive */}
      {syncedImages.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-sky-400" />
            Danh sách Link 12 Image đã tạo trên Drive ({syncedImages.length}/12)
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <th className="py-2.5 px-3 text-left w-12">STT</th>
                  <th className="py-2.5 px-3 text-left">Key LSI (Tiếng Việt có dấu)</th>
                  <th className="py-2.5 px-3 text-left w-28">Vị trí Key</th>
                  <th className="py-2.5 px-3 text-left">Link Image Google Drive</th>
                </tr>
              </thead>
              <tbody>
                {syncedImages.map((img, idx) => {
                  const keyNum = img.keyField ? img.keyField.replace('lsi_', '') : (30 + idx);
                  const keywordVal = stackKeywords?.[img.keyField] || img.filename || img.title || `LSI keywords ${keyNum}`;
                  return (
                    <tr key={img.keyField || idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 text-slate-200 font-medium">{keywordVal}</td>
                      <td className="py-2 px-3 text-sky-400 font-mono font-semibold">LSI {keyNum}</td>
                      <td className="py-2 px-3">
                        <a
                          href={img.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline underline-offset-2 font-medium"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" /> Mở Ảnh trên Drive
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

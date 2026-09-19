import React from 'react';
import { ExternalLink, CheckCircle2, FileText, FileCode, Sparkles, Video, FileSpreadsheet, MapPin } from 'lucide-react';
import { useStack } from '../stack.context';

export default function OptimizedLinksTable() {
  const { 
    selectedStack, stackKeywords, 
    optimizeResults, pdfResults, sheetOptimizeResult, 
    step4Data 
  } = useStack();

  const hasDocsOptimized = optimizeResults && optimizeResults.length > 0;
  const hasPdfOptimized = pdfResults && pdfResults.length > 0;
  const hasSheetOptimized = sheetOptimizeResult !== null;

  // Nếu người dùng chưa thực hiện bấm bất kỳ Nút tối ưu nào -> Không hiển thị bảng
  if (!hasDocsOptimized && !hasPdfOptimized && !hasSheetOptimized) {
    return null;
  }

  const getKeywordDisplay = (keyField) => {
    if (!keyField) return '—';
    if (keyField === 'main_key') return selectedStack?.main_key || 'Key chính';
    if (keyField === 'key_chinh_local') return stackKeywords?.key_chinh_local || 'Key chính + Local';
    if (keyField === 'lsi_local') return stackKeywords?.key_chinh_local || 'LSI Local';
    return stackKeywords?.[keyField] || keyField;
  };

  const docsList = [];
  const pdfList = [];
  const sheetList = [];
  const uploadList = [];

  // 1. Chỉ gom danh sách các tệp Google Docs khi đã kích hoạt Nút 1 (Tối ưu Docs)
  if (hasDocsOptimized) {
    const rawAssets = selectedStack?.assets
      ? (typeof selectedStack.assets === 'string' ? JSON.parse(selectedStack.assets) : selectedStack.assets)
      : [];

    const allDocsAssets = (rawAssets || []).filter(a => a.type === 'document' && (a.driveUrl || a.pubUrl));
    const optMap = {};
    (optimizeResults || []).forEach(r => {
      optMap[r.keyField] = r;
    });

    allDocsAssets.forEach(doc => {
      const opt = optMap[doc.keyField];
      const isOptimized = Boolean(opt);
      docsList.push({
        key: getKeywordDisplay(doc.keyField),
        type: isOptimized ? 'Google Docs (Đã tối ưu AI)' : 'Google Docs (Tài sản Bước 3)',
        icon: FileText,
        color: isOptimized ? 'text-sky-400' : 'text-slate-400',
        url: opt?.driveUrl || doc.driveUrl || opt?.pubUrl || doc.pubUrl || '',
        isOptimized: isOptimized
      });
    });
  }

  // 2. Chỉ bổ sung tệp PDF, Script, Video, KML khi đã kích hoạt Nút 2 (Tạo và Tối ưu PDF)
  if (hasPdfOptimized) {
    (pdfResults || []).forEach(item => {
      if (item.pdfUrl) {
        pdfList.push({
          key: getKeywordDisplay(item.keyField),
          type: 'Google PDF & Entity Comments',
          icon: FileCode,
          color: 'text-emerald-400',
          url: item.pdfUrl,
          isOptimized: true
        });
      }
    });

    // Gom danh sách các tệp Upload (Script .txt, Video .mp4, KML .kml)
    (step4Data || []).filter(item => item.isUpload).forEach(item => {
      const fileUrl = item.driveUrl || item.fileInfo?.driveUrl || item.assetLink || '';
      if (!fileUrl) return;

      let typeName = 'File Upload';
      let icon = FileText;
      let color = 'text-slate-400';

      if (item.fileType === 'script') {
        typeName = 'Script Upload (.txt)';
        icon = FileText;
        color = 'text-amber-400';
      } else if (item.fileType === 'video') {
        typeName = 'Video Upload (.mp4)';
        icon = Video;
        color = 'text-red-400';
      } else if (item.fileType === 'kml') {
        typeName = 'File KML Upload (.kml)';
        icon = MapPin;
        color = 'text-emerald-400';
      }

      uploadList.push({
        key: getKeywordDisplay(item.keyField),
        type: typeName,
        icon,
        color,
        url: fileUrl,
        isOptimized: true
      });
    });
  }

  // 3. Chỉ bổ sung Google Sheet, Slide, Form khi đã kích hoạt Nút 3 (Tối ưu Sheet, Slide, Form)
  if (hasSheetOptimized && sheetOptimizeResult) {
    if (sheetOptimizeResult.sheetResult?.driveUrl || sheetOptimizeResult.sheetResult?.pubUrl) {
      sheetList.push({
        key: getKeywordDisplay('lsi_10'),
        type: 'Google Sheet (Trang tính đại diện)',
        icon: FileSpreadsheet,
        color: 'text-purple-400',
        url: sheetOptimizeResult.sheetResult.driveUrl || sheetOptimizeResult.sheetResult.pubUrl,
        isOptimized: true
      });
    }
    if (sheetOptimizeResult.slideResult?.driveUrl || sheetOptimizeResult.slideResult?.pubUrl) {
      sheetList.push({
        key: getKeywordDisplay('lsi_11'),
        type: 'Google Slide (Trình bày)',
        icon: Sparkles,
        color: 'text-amber-400',
        url: sheetOptimizeResult.slideResult.driveUrl || sheetOptimizeResult.slideResult.pubUrl,
        isOptimized: true
      });
    }
    if (sheetOptimizeResult.formResult?.driveUrl || sheetOptimizeResult.formResult?.pubUrl) {
      sheetList.push({
        key: getKeywordDisplay('lsi_12'),
        type: 'Google Form (Biểu mẫu)',
        icon: FileText,
        color: 'text-indigo-400',
        url: sheetOptimizeResult.formResult.driveUrl || sheetOptimizeResult.formResult.pubUrl,
        isOptimized: true
      });
    }
  }

  // Tổng hợp các dòng hiển thị hiện tại theo tiến trình bấm của người dùng
  const allOptimizedLinks = [...docsList, ...pdfList, ...sheetList, ...uploadList];

  if (allOptimizedLinks.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Bảng Tổng Hợp Các Link Đã Được Tối Ưu ({allOptimizedLinks.length} tài sản)
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">Hiển thị theo tiến trình nút</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <th className="py-2.5 px-3 text-left w-64">Key (Từ khóa)</th>
              <th className="py-2.5 px-3 text-left w-56">Loại tài sản</th>
              <th className="py-2.5 px-3 text-left">Link tài sản</th>
              <th className="py-2.5 px-3 text-center w-28">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {allOptimizedLinks.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">
                    <span className="text-sky-300 font-medium">{item.key}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <IconComp className={`w-3.5 h-3.5 ${item.color}`} />
                      {item.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 hover:bg-slate-800 text-sky-400 hover:text-sky-300 font-semibold text-xs rounded-lg border border-slate-800 hover:border-sky-500/40 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Mở tài sản
                    </a>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.isOptimized ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Đã tối ưu
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">Chờ tối ưu</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

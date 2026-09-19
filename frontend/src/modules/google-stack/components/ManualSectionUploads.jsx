import React from 'react';
import { Upload, FileText, Map, Video, Eye, Loader2, Info, ExternalLink } from 'lucide-react';
import { useStack } from '../stack.context';
import { useNotification } from '../../../context/NotificationContext';
import api from '../../../services/api';

/* 
  ===================================================================
  TUTORIAL ASSET BREADCRUMB:
  Image Path Pattern: /assets/tutorials/step4/uploads/<type>_step_<N>.jpg
  Recommended Image Size: 800x450px (Aspect Ratio 16:9)
  ===================================================================
*/

const TUTORIAL_STEPS = {
  kml: [
    { step: 1, text: "Truy cập Google My Maps và tạo bản đồ khu vực doanh nghiệp", img: null, size: "800x450px" },
    { step: 2, text: "Xuất dữ liệu bản đồ dưới dạng định dạng tệp .KML", img: null, size: "800x450px" },
    { step: 3, text: "Upload tệp .KML vừa xuất vào khu vực bên dưới (File sẽ tự động đổi tên thành LSI + Local)", img: null, size: "800x450px" }
  ],
  video: [
    { step: 1, text: "Chuẩn bị Video giới thiệu sản phẩm / thương hiệu định dạng .MP4", img: null, size: "800x450px" },
    { step: 2, text: "Kiểm tra chất lượng Video (đảm bảo độ phân giải HD trở lên)", img: null, size: "800x450px" },
    { step: 3, text: "Tải Video lên khu vực bên dưới (File sẽ tự động đổi tên theo Từ khóa chính)", img: null, size: "800x450px" }
  ]
};

export default function ManualSectionUploads() {
  const { activeStackId, selectedStack, stackKeywords, step4Data, setStep4Data, setZoomImage } = useStack();
  const { showNotification } = useNotification();

  const [uploadingType, setUploadingType] = React.useState(null);

  const mainKey = selectedStack?.main_key || 'Key chính';
  const lsiLocal = stackKeywords?.lsi_local || 'LSI + Local';

  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!activeStackId) {
      showNotification('Vui lòng chọn Stack trước khi upload!', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);

    setUploadingType(fileType);
    try {
      const res = await api.post(`/google-stacks/step4/upload-file/${activeStackId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStep4Data(res.data.step4_data || []);
      if (res.data.drive_url) {
        showNotification(res.data.message || `Upload file ${fileType.toUpperCase()} thành công và đẩy lên Google Drive!`);
      } else if (res.data.drive_error) {
        showNotification(res.data.message, 'warning');
      } else {
        showNotification(res.data.message || `Upload file ${fileType.toUpperCase()} thành công!`);
      }
    } catch (err) {
      showNotification(err.response?.data?.error || `Lỗi khi upload ${fileType}`, 'error');
    } finally {
      setUploadingType(null);
      e.target.value = '';
    }
  };

  const getFileInfo = (fileType) => {
    if (!step4Data || !Array.isArray(step4Data)) return null;
    return step4Data.find(item => item.isUpload && item.fileType === fileType);
  };

  const renderFileBox = (fileType, colorCls, labelText) => {
    const info = getFileInfo(fileType);
    if (!info || (!info.assetLink && !info.driveUrl)) return null;

    const driveUrl = info.driveUrl || (info.assetLink?.startsWith('http') ? info.assetLink : null);
    const filename = info.fileInfo?.filename || labelText;

    return (
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className={`${colorCls} font-bold flex items-center gap-1.5`}>
            ✓ Đã tải lên: {filename}
          </span>
          {driveUrl ? (
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Mở File trên Google Drive
            </a>
          ) : (
            <a
              href={info.assetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sky-400 hover:underline"
            >
              Xem file local
            </a>
          )}
        </div>
        {driveUrl && (
          <p className="text-[11px] text-slate-400 font-mono truncate" title={driveUrl}>
            Link Drive: <span className="text-slate-300">{driveUrl}</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1.1 Script Upload */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
              <FileText className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">1.1 Script Upload (.txt)</h4>
              <p className="text-[11px] text-slate-400">File kịch bản định dạng .txt. Đặt tên theo Key chính: <span className="text-sky-300 font-semibold">{mainKey}</span></p>
            </div>
          </div>
          <label className={`flex items-center gap-2 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-colors ${uploadingType === 'script' ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploadingType === 'script' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>Upload Script (.txt)</span>
            <input type="file" accept=".txt" onChange={(e) => handleFileUpload(e, 'script')} className="hidden" />
          </label>
        </div>
        {renderFileBox('script', 'text-sky-400', `${mainKey}.txt`)}
      </div>

      {/* 1.2 KML Upload & Tutorial */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Map className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">1.2 Hướng dẫn & Upload File KML (.kml)</h4>
            <p className="text-[11px] text-slate-400">File bản đồ KML. Đặt tên theo LSI + Local: <span className="text-emerald-300 font-semibold">{lsiLocal}</span></p>
          </div>
        </div>

        {/* Tutorial steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {TUTORIAL_STEPS.kml.map(s => (
            <div key={s.step} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-bold text-emerald-400 font-mono">Bước {s.step}</span>
              <p className="text-xs text-slate-300 leading-snug">{s.text}</p>
              <div 
                onClick={() => s.img && setZoomImage(s.img)}
                className="aspect-video bg-slate-900 border border-slate-800/80 rounded-lg flex items-center justify-center cursor-pointer hover:border-emerald-500/40 transition-all relative group"
              >
                {s.img ? (
                  <img src={s.img} alt={`KML Step ${s.step}`} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="text-center p-2">
                    <Eye className="w-4 h-4 text-slate-600 mx-auto mb-1 group-hover:text-emerald-400" />
                    <span className="text-[10px] text-slate-600 font-mono">Image Step {s.step} ({s.size})</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Upload button — moved below tutorial images */}
        <label className={`inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-colors ${uploadingType === 'kml' ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploadingType === 'kml' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span>Upload File KML (.kml)</span>
          <input type="file" accept=".kml" onChange={(e) => handleFileUpload(e, 'kml')} className="hidden" />
        </label>

        {renderFileBox('kml', 'text-emerald-400', `${lsiLocal}.kml`)}
      </div>

      {/* 1.3 Video Upload & Tutorial */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Video className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">1.3 Hướng dẫn & Upload Video (.mp4)</h4>
            <p className="text-[11px] text-slate-400">File Video sản phẩm. Đặt tên theo Key chính: <span className="text-purple-300 font-semibold">{mainKey}</span></p>
          </div>
        </div>

        {/* Tutorial steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {TUTORIAL_STEPS.video.map(s => (
            <div key={s.step} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-bold text-purple-400 font-mono">Bước {s.step}</span>
              <p className="text-xs text-slate-300 leading-snug">{s.text}</p>
              <div 
                onClick={() => s.img && setZoomImage(s.img)}
                className="aspect-video bg-slate-900 border border-slate-800/80 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500/40 transition-all relative group"
              >
                {s.img ? (
                  <img src={s.img} alt={`Video Step ${s.step}`} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="text-center p-2">
                    <Eye className="w-4 h-4 text-slate-600 mx-auto mb-1 group-hover:text-purple-400" />
                    <span className="text-[10px] text-slate-600 font-mono">Image Step {s.step} ({s.size})</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Upload button — moved below tutorial images */}
        <label className={`inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-colors ${uploadingType === 'video' ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploadingType === 'video' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span>Upload Video (.mp4)</span>
          <input type="file" accept=".mp4" onChange={(e) => handleFileUpload(e, 'video')} className="hidden" />
        </label>

        {renderFileBox('video', 'text-purple-400', `${mainKey}.mp4`)}
      </div>
    </div>
  );
}

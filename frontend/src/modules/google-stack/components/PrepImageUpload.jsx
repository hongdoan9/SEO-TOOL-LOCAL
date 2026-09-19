import React from 'react';
import { Upload, Image as ImageIcon, Trash2, Eye, Loader2, Info } from 'lucide-react';
import { useStack } from '../stack.context';
import { useNotification } from '../../../context/NotificationContext';
import api from '../../../services/api';

export default function PrepImageUpload() {
  const { 
    activeStackId, stackKeywords, step4Images, setStep4Images, 
    uploadingStep4Images, setUploadingStep4Images, setZoomImage 
  } = useStack();
  const { showNotification } = useNotification();

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!activeStackId) {
      showNotification('Vui lòng chọn hoặc tạo bộ Stack trước khi upload ảnh!', 'error');
      return;
    }

    if (files.length > 12) {
      showNotification('Chỉ được chọn tối đa 12 hình ảnh!', 'warning');
    }

    const formData = new FormData();
    files.slice(0, 12).forEach(file => {
      formData.append('images', file);
    });

    setUploadingStep4Images(true);
    try {
      const res = await api.post(`/google-stacks/step4/upload-images/${activeStackId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStep4Images(res.data.step4_images || []);
      showNotification(res.data.message || 'Upload 12 ảnh thành công!');
    } catch (err) {
      showNotification(err.response?.data?.error || 'Lỗi khi tải ảnh lên', 'error');
    } finally {
      setUploadingStep4Images(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (keyField) => {
    const updated = (step4Images || []).filter(img => img.keyField !== keyField);
    setStep4Images(updated);
    if (activeStackId) {
      api.post(`/google-stacks/step4/${activeStackId}`, { step4_images: updated }).catch(console.error);
    }
  };

  // 12 slots corresponding to lsi_30 through lsi_41
  const imageSlots = Array.from({ length: 12 }, (_, i) => {
    const num = 30 + i;
    const keyField = `lsi_${num}`;
    const keyLabel = `LSI keywords ${num}`;
    const keywordTitle = stackKeywords?.[keyField] || '';
    const uploadedImg = (step4Images || []).find(img => img.keyField === keyField);
    return { num, keyField, keyLabel, keywordTitle, uploadedImg };
  });

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
    return `http://localhost:5050${url}`;
  };

  return (
    <div className="pt-4 border-t border-slate-800 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-sky-400" />
            Upload 12 Image (Hình ảnh Sản phẩm / Thương hiệu)
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tải lên tối đa 12 hình ảnh. Tên ảnh sẽ tự động được gán theo từ khóa LSI (LSI 30 - LSI 41) khi đẩy lên Drive.
          </p>
        </div>

        <label className={`flex items-center gap-2 px-3 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-colors ${uploadingStep4Images ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploadingStep4Images ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>{uploadingStep4Images ? 'Đang upload...' : 'Upload bộ 12 Image'}</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploadingStep4Images}
          />
        </label>
      </div>

      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-300 leading-relaxed">
          <strong className="text-amber-300">Lưu ý:</strong> Bạn có thể upload 12 hình ảnh ngay tại bước này. Bộ 12 ảnh sẽ tự động được liên kết với bộ từ khóa (LSI 30 đến LSI 41) nhập ở Bước 2 và đồng bộ lên Google Drive.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {imageSlots.map(({ num, keyField, keyLabel, keywordTitle, uploadedImg }) => (
          <div 
            key={keyField}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 flex flex-col justify-between space-y-2 group relative transition-all"
          >
            <div className="aspect-square bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center relative">
              {uploadedImg ? (
                <>
                  <img 
                    src={getImageUrl(uploadedImg.url)} 
                    alt={keywordTitle || keyLabel}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoomImage(getImageUrl(uploadedImg.url))}
                      className="p-1.5 bg-slate-800/90 text-slate-200 hover:text-white rounded-lg"
                      title="Xem ảnh"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(keyField)}
                      className="p-1.5 bg-rose-900/80 text-rose-300 hover:text-white rounded-lg"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-2">
                  <ImageIcon className="w-6 h-6 text-slate-700 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-600 block font-mono">Chưa có ảnh</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="text-sky-400 font-semibold">Ảnh #{num - 29}</span>
                <span className="font-mono text-slate-500">LSI {num}</span>
              </div>
              <p className="text-[11px] font-medium text-slate-200 truncate mt-0.5" title={keywordTitle || keyLabel}>
                {keywordTitle ? keywordTitle : <span className="text-slate-500 italic">{keyLabel}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

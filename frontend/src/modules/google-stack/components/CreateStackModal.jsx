import React, { useState, useEffect } from 'react';
import Modal from '../../../shared/components/Modal';
import { useProjectData } from '../../../context/ProjectDataContext';
import { useUser } from '../../../context/UserContext';
import { handleCreateGoogleStack } from '../stack.api';
import { useNotification } from '../../../context/NotificationContext';
import { useStack } from '../stack.context';

export default function CreateStackModal({ isOpen, onClose }) {
  const { businessInfo: safeBiz, fetchGoogleStacks } = useProjectData();
  const { selectedProject } = useUser();
  const { setActiveStackId } = useStack();
  const { showNotification } = useNotification();
  
  const [newGoogleStack, setNewGoogleStack] = useState({ url: '', brand: '', main_key: '', drive_folder: '', phone: '', address: '' });

  useEffect(() => {
    if (isOpen) {
      const defaultBrand = safeBiz.brand || safeBiz.company_name || '';
      const defaultPhone = (Array.isArray(safeBiz.phones) && safeBiz.phones[0]) || '';
      const defaultAddr = (Array.isArray(safeBiz.addresses) && safeBiz.addresses[0]?.address) || '';
      const defaultUrl = safeBiz.website || '';

      setNewGoogleStack({
        url: defaultUrl,
        brand: defaultBrand,
        main_key: '',
        drive_folder: '',
        phone: defaultPhone,
        address: defaultAddr
      });
    }
  }, [isOpen, safeBiz]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const res = await handleCreateGoogleStack(selectedProject.id, newGoogleStack);
      showNotification('Đã tạo Google Stack mới thành công!');
      fetchGoogleStacks(selectedProject.id);
      setActiveStackId(res.data.id);
      onClose();
    } catch (e) {
      showNotification(e.response?.data?.error || 'Lỗi khi tạo Google Stack', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <>
          Tạo Bộ Google Stack Mới
          <p className="text-[11px] text-emerald-400 font-medium font-normal mt-1">✨ Đã tự động liên kết Brand, Phone, Address từ Module 1</p>
        </>
      }
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block text-xs text-slate-400 mb-1 font-medium">URL Website chính</label>
        <input
          type="text"
          required
          value={newGoogleStack.url || ''}
          onChange={(e) => setNewGoogleStack(prev => ({ ...prev, url: e.target.value }))}
          placeholder="https://example.com"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1 font-medium">Brand Name (Tự liên kết)</label>
          <input
            type="text"
            required
            value={newGoogleStack.brand || ''}
            onChange={(e) => setNewGoogleStack(prev => ({ ...prev, brand: e.target.value }))}
            placeholder="Tên thương hiệu..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 font-medium">Từ khóa chính</label>
          <input
            type="text"
            required
            value={newGoogleStack.main_key || ''}
            onChange={(e) => setNewGoogleStack(prev => ({ ...prev, main_key: e.target.value }))}
            placeholder="Từ khóa SEO chính..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1 font-medium">Link Thư mục Google Drive</label>
        <input
          type="text"
          required
          value={newGoogleStack.drive_folder || ''}
          onChange={(e) => setNewGoogleStack(prev => ({ ...prev, drive_folder: e.target.value }))}
          placeholder="https://drive.google.com/drive/folders/..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1 font-medium">Hotline Phone (Tự liên kết)</label>
          <input
            type="text"
            value={newGoogleStack.phone || ''}
            onChange={(e) => setNewGoogleStack(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="090..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 font-medium">Địa chỉ (Tự liên kết)</label>
          <input
            type="text"
            value={newGoogleStack.address || ''}
            onChange={(e) => setNewGoogleStack(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Địa chỉ..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition-colors"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition-colors"
        >
          Tạo Google Stack
        </button>
      </div>
    </Modal>
  );
}

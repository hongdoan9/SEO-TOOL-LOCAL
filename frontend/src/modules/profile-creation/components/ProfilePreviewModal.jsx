import React from 'react';
import Modal from '../../../shared/components/Modal';
import { Building2, Globe, Mail, Phone, FileText, CheckCircle2 } from 'lucide-react';

export default function ProfilePreviewModal({ isOpen, onClose, businessInfo }) {
  const biz = businessInfo || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="👁️ Dữ Liệu Doanh Nghiệp Tự Động Điền (Module 1)">
      <div className="space-y-4 text-xs">
        <p className="text-slate-400">
          Đây là bộ thông tin sẽ được <span className="text-sky-400 font-bold">Chrome Extension Worker Agent</span> tự động gõ phím (Human-like typing) điền vào các trang Social:
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-200">
            <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="font-bold">Tên Thương Hiệu (Brand):</span>
            <span className="text-emerald-400 font-bold ml-auto">{biz.brand || biz.company_name || 'Chưa thiết lập'}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-200">
            <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-bold">Website Doanh Nghiệp:</span>
            <span className="text-sky-400 truncate ml-auto">{biz.website || 'Chưa thiết lập'}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-200">
            <Mail className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="font-bold">Email Đăng Ký:</span>
            <span className="text-slate-300 ml-auto">{biz.email || 'seotest.auto@gmail.com'}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-200">
            <Phone className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold">Số Điện Thoại Chính:</span>
            <span className="text-slate-300 ml-auto">
              {Array.isArray(biz.phones) && biz.phones.length > 0 ? biz.phones[0] : (biz.phone || 'Chưa thiết lập')}
            </span>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-slate-200">
              <FileText className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-bold">Đoạn Bio Doanh Nghiệp (Bio 1):</span>
            </div>
            <p className="text-slate-400 italic bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 line-clamp-3">
              {biz.bio1 || biz.usp || 'Chưa có bài Bio 1. Extension sẽ lấy mô tả mặc định.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đồng bộ thời gian thực từ Module 1
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}

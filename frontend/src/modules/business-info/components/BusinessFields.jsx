import React from 'react';
import { Building2, Package } from 'lucide-react';

export default function BusinessFields({ businessInfo, setBusinessInfo }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBusinessInfo(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" /> Thông tin Định danh Cơ bản
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Website chính</label>
            <input
              type="text"
              name="website"
              value={businessInfo.website || ''}
              onChange={handleChange}
              placeholder="https://example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Tên Thương hiệu (Brand)</label>
            <input
              type="text"
              name="brand"
              value={businessInfo.brand || ''}
              onChange={handleChange}
              placeholder="Ví dụ: VinFast, Shopee..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Tên Công ty Pháp lý</label>
            <input
              type="text"
              name="company_name"
              value={businessInfo.company_name || ''}
              onChange={handleChange}
              placeholder="Công ty TNHH ABC..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-sky-400 mb-1 font-bold">Email / Gmail Đăng Ký Social</label>
            <input
              type="email"
              name="email"
              value={businessInfo.email || ''}
              onChange={handleChange}
              placeholder="your_email@gmail.com"
              className="w-full bg-slate-950 border border-sky-500/50 rounded-xl px-3 py-2 text-xs text-sky-300 focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Ngày thành lập</label>
            <input
              type="text"
              name="founded_date"
              value={businessInfo.founded_date || ''}
              onChange={handleChange}
              placeholder="DD/MM/YYYY"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Người đại diện / Sáng lập</label>
            <input
              type="text"
              name="owner"
              value={businessInfo.owner || ''}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Mã số thuế</label>
            <input
              type="text"
              name="tax_code"
              value={businessInfo.tax_code || ''}
              onChange={handleChange}
              placeholder="0101234567"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Ngành nghề kinh doanh</label>
            <input
              type="text"
              name="industry"
              value={businessInfo.industry || ''}
              onChange={handleChange}
              placeholder="Dịch vụ SEO, Bất động sản..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Quy mô nhân sự</label>
            <input
              type="text"
              name="employees"
              value={businessInfo.employees || ''}
              onChange={handleChange}
              placeholder="50 - 100 nhân viên"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Phạm vi / Khu vực hoạt động</label>
            <input
              type="text"
              name="activity_area"
              value={businessInfo.activity_area || ''}
              onChange={handleChange}
              placeholder="Toàn quốc, TP.HCM, Hà Nội..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Search ID / Mã tìm kiếm</label>
            <input
              type="text"
              name="search_id"
              value={businessInfo.search_id || ''}
              onChange={handleChange}
              placeholder="Mã ID tìm kiếm thương hiệu..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Package className="w-4 h-4 text-sky-400" /> Sản phẩm, Tính năng & Năng lực Thương hiệu
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Sản phẩm / Dịch vụ chính</label>
            <textarea
              rows={3}
              name="products"
              value={businessInfo.products || ''}
              onChange={handleChange}
              placeholder="Danh sách sản phẩm, dịch vụ cung cấp..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Đặc điểm / Tính năng nổi bật</label>
            <textarea
              rows={3}
              name="features"
              value={businessInfo.features || ''}
              onChange={handleChange}
              placeholder="Tính năng nổi bật của sản phẩm..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Điểm bán hàng độc nhất (USP)</label>
            <textarea
              rows={3}
              name="usp"
              value={businessInfo.usp || ''}
              onChange={handleChange}
              placeholder="Lợi thế cạnh tranh vượt trội..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Thành tựu chính</label>
            <textarea
              rows={3}
              name="achievements"
              value={businessInfo.achievements || ''}
              onChange={handleChange}
              placeholder="Các giải thưởng, cột mốc thành tựu..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">Chứng chỉ / Giấy phép</label>
            <textarea
              rows={3}
              name="certificates"
              value={businessInfo.certificates || ''}
              onChange={handleChange}
              placeholder="Chứng chỉ ISO, giấy phép đăng ký..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>
        </div>
      </div>
    </>
  );
}

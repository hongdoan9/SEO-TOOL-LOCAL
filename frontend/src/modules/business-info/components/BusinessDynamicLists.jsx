import React from 'react';
import { Phone, MapPin, Plus, Trash2, FileText } from 'lucide-react';
import WPEditor from '../../../WPEditor';

export default function BusinessDynamicLists({ businessInfo, setBusinessInfo }) {
  const handlePhoneChange = (index, value) => {
    const updated = [...(businessInfo.phones || [])];
    updated[index] = value;
    setBusinessInfo(prev => ({ ...prev, phones: updated }));
  };

  const addPhone = () => {
    setBusinessInfo(prev => ({ ...prev, phones: [...(prev.phones || []), ''] }));
  };

  const removePhone = (index) => {
    setBusinessInfo(prev => ({ ...prev, phones: (prev.phones || []).filter((_, i) => i !== index) }));
  };

  const handleAddressChange = (index, field, value) => {
    const updated = [...(businessInfo.addresses || [])];
    updated[index] = { ...updated[index], [field]: value };
    setBusinessInfo(prev => ({ ...prev, addresses: updated }));
  };

  const addAddress = () => {
    setBusinessInfo(prev => ({
      ...prev,
      addresses: [...(prev.addresses || []), { address: '', map_url: '', lat: '', lng: '' }]
    }));
  };

  const removeAddress = (index) => {
    setBusinessInfo(prev => ({ ...prev, addresses: (prev.addresses || []).filter((_, i) => i !== index) }));
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-sky-400" /> Danh sách Hotline / SĐT
            </h3>
            <button
              type="button"
              onClick={addPhone}
              className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm SĐT
            </button>
          </div>
          <div className="space-y-2">
            {(businessInfo.phones || []).map((phone, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => handlePhoneChange(idx, e.target.value)}
                  placeholder={`SĐT hotline ${idx + 1}`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => removePhone(idx)}
                  className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!businessInfo.phones || businessInfo.phones.length === 0) && (
              <p className="text-xs text-slate-500 italic">Chưa có số điện thoại nào. Nhấn "+ Thêm SĐT".</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" /> Danh sách Địa chỉ Chi nhánh
          </h3>
          <button
            type="button"
            onClick={addAddress}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Địa chỉ
          </button>
        </div>

        {(businessInfo.addresses || []).length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-800/60">
                  <th className="text-left text-slate-400 font-semibold px-3 py-2.5 whitespace-nowrap">Địa chỉ <span className="text-rose-400">*</span></th>
                  <th className="text-left text-slate-400 font-semibold px-3 py-2.5 whitespace-nowrap">URL Map <span className="text-rose-400">*</span></th>
                  <th className="text-left text-slate-400 font-semibold px-3 py-2.5 whitespace-nowrap">Latitude</th>
                  <th className="text-left text-slate-400 font-semibold px-3 py-2.5 whitespace-nowrap">Longitude</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {(businessInfo.addresses || []).map((addr, idx) => (
                  <tr key={idx} className="border-t border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={addr?.address || ''}
                        onChange={(e) => handleAddressChange(idx, 'address', e.target.value)}
                        placeholder={`Địa chỉ chi nhánh ${idx + 1}`}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 min-w-[180px]"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={addr?.map_url || ''}
                        onChange={(e) => handleAddressChange(idx, 'map_url', e.target.value)}
                        placeholder="https://maps.google.com/..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 min-w-[180px]"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={addr?.lat || ''}
                        onChange={(e) => handleAddressChange(idx, 'lat', e.target.value)}
                        placeholder="10.762..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 min-w-[90px]"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={addr?.lng || ''}
                        onChange={(e) => handleAddressChange(idx, 'lng', e.target.value)}
                        placeholder="106.660..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 min-w-[90px]"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeAddress(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">Chưa có địa chỉ nào. Nhấn "+ Thêm Địa chỉ".</p>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" /> Chuỗi NAP & Bio Giới thiệu Thương hiệu (WordPress Rich Editor)
        </h3>

        <div className="space-y-2">
          <label className="block text-xs text-slate-300 font-semibold">1. Chuỗi NAP chuẩn (Name - Address - Phone)</label>
          <WPEditor
            value={businessInfo.nap || ''}
            onChange={(content) => setBusinessInfo(prev => ({ ...prev, nap: content }))}
            placeholder="Tên thương hiệu - Địa chỉ - Hotline (hỗ trợ chèn link, định dạng Visual/Text HTML)..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-slate-300 font-semibold">2. Bio Giới thiệu 1 (Ngắn 50 - 100 từ)</label>
          <WPEditor
            value={businessInfo.bio1 || ''}
            onChange={(content) => setBusinessInfo(prev => ({ ...prev, bio1: content }))}
            placeholder="Nhập nội dung Bio 1 ngắn (hỗ trợ chèn link, định dạng Visual/Text HTML)..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-slate-300 font-semibold">3. Bio Giới thiệu 2 (Trung bình 150 - 250 từ)</label>
          <WPEditor
            value={businessInfo.bio2 || ''}
            onChange={(content) => setBusinessInfo(prev => ({ ...prev, bio2: content }))}
            placeholder="Nhập nội dung Bio 2 vừa (hỗ trợ chèn link, định dạng Visual/Text HTML)..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-slate-300 font-semibold">4. Bio Giới thiệu 3 (Chi tiết đầy đủ thành tựu)</label>
          <WPEditor
            value={businessInfo.bio3 || ''}
            onChange={(content) => setBusinessInfo(prev => ({ ...prev, bio3: content }))}
            placeholder="Nhập nội dung Bio 3 chi tiết (hỗ trợ chèn link, định dạng Visual/Text HTML)..."
          />
        </div>
      </div>
    </>
  );
}

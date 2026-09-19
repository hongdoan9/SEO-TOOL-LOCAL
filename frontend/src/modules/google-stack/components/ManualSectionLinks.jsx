import React from 'react';
import { ExternalLink, Globe, MapPin, Share2, Video, Image as ImageIcon, Calendar, Layers, Eye, Save } from 'lucide-react';
import { useStack } from '../stack.context';
import { useNotification } from '../../../context/NotificationContext';
import api from '../../../services/api';

/* 
  ===================================================================
  TUTORIAL ASSET BREADCRUMB:
  Image Path Pattern: /assets/tutorials/step4/links/<section_id>_step_<N>.jpg
  Recommended Image Size: 800x450px (Aspect Ratio 16:9)
  ===================================================================
*/

const LINK_SECTIONS = [
  {
    id: 2,
    name: 'Google My Maps',
    icon: MapPin,
    color: 'text-rose-400',
    keyType: 'key_chinh_local',
    placeholder: 'https://www.google.com/maps/d/viewer?mid=...',
    steps: [
      { step: 1, text: "Mở Google My Maps và tạo bản đồ lớp phủ vùng dịch vụ", size: "800x450px" },
      { step: 2, text: "Nhập tiêu đề và mô tả chứa từ khóa chính + địa phương", size: "800x450px" },
      { step: 3, text: "Sao chép liên kết chia sẻ công khai và dán vào ô bên dưới", size: "800x450px" }
    ]
  },
  {
    id: 1,
    name: 'Google site view',
    icon: Globe,
    color: 'text-sky-400',
    keyType: 'main_key',
    placeholder: 'https://sites.google.com/view/...',
    isSimpleTable: true,
    steps: []
  },
  {
    id: 3,
    name: 'GMB post',
    icon: Share2,
    color: 'text-emerald-400',
    keyType: 'main_key',
    placeholder: 'https://posts.gle/... hoặc URL bài viết GMB',
    steps: [
      { step: 1, text: "Đăng bài viết mới trên Google Business Profile", size: "800x450px" },
      { step: 2, text: "Sao chép liên kết trực tiếp bài đăng GMB", size: "800x450px" },
      { step: 3, text: "Dán liên kết bài viết vào ô bên dưới", size: "800x450px" }
    ]
  },
  {
    id: 4,
    name: 'Youtube',
    icon: Video,
    color: 'text-red-500',
    keyType: 'lsi_1',
    placeholder: 'https://www.youtube.com/watch?v=...',
    steps: [
      { step: 1, text: "Tải video thương hiệu lên kênh Youtube", size: "800x450px" },
      { step: 2, text: "Tối ưu tiêu đề & mô tả bài đăng theo từ khóa LSI 1", size: "800x450px" },
      { step: 3, text: "Sao chép URL video Youtube và dán vào bên dưới", size: "800x450px" }
    ]
  },
  {
    id: 5,
    name: 'Twitter',
    icon: Share2,
    color: 'text-sky-400',
    keyType: 'lsi_2',
    placeholder: 'https://x.com/username/status/...',
    steps: [
      { step: 1, text: "Tạo bài viết đăng lên X (Twitter)", size: "800x450px" },
      { step: 2, text: "Đính kèm hashtag từ khóa LSI 2 và link website", size: "800x450px" },
      { step: 3, text: "Sao chép đường dẫn bài tweet dán vào bên dưới", size: "800x450px" }
    ]
  },
  {
    id: 6,
    name: 'Pinterest',
    icon: ImageIcon,
    color: 'text-rose-500',
    keyType: 'lsi_3',
    placeholder: 'https://www.pinterest.com/pin/...',
    steps: [
      { step: 1, text: "Tạo Pin mới trên trang Pinterest thương hiệu", size: "800x450px" },
      { step: 2, text: "Chèn link đích website và từ khóa LSI 3", size: "800x450px" },
      { step: 3, text: "Dán đường dẫn Pin vào ô bên dưới", size: "800x450px" }
    ]
  },
  {
    id: 7,
    name: 'Linkedin',
    icon: Share2,
    color: 'text-indigo-400',
    keyType: 'lsi_4',
    placeholder: 'https://...',
    isCustomizable: true,
    steps: []
  },
  {
    id: 11,
    name: 'Pearltree',
    icon: Layers,
    color: 'text-teal-400',
    keyType: 'cluster_2',
    placeholder: 'https://www.pearltrees.com/...',
    steps: [
      { step: 1, text: "Tạo bộ sưu tập mới trên Pearltrees", size: "800x450px" },
      { step: 2, text: "Thêm liên kết tài sản Google Entity vào bộ sưu tập", size: "800x450px" },
      { step: 3, text: "Sao chép URL Pearltree công khai và dán vào ô bên dưới", size: "800x450px" }
    ]
  },
  {
    id: 9,
    name: 'Calendar',
    icon: Calendar,
    color: 'text-amber-400',
    keyType: 'lsi_14',
    placeholder: 'https://calendar.google.com/calendar/embed?src=...',
    steps: [
      { step: 1, text: "Tạo sự kiện công khai trên Google Calendar", size: "800x450px" },
      { step: 2, text: "Chia sẻ lịch công khai lấy Calendar HTML / ID", size: "800x450px" },
      { step: 3, text: "Dán đường dẫn Lịch chia sẻ vào ô bên dưới", size: "800x450px" }
    ]
  }
];

export default function ManualSectionLinks() {
  const { activeStackId, selectedStack, stackKeywords, step4Data, setStep4Data, setZoomImage } = useStack();
  const { showNotification } = useNotification();

  const handleLinkChange = (id, newLink) => {
    const updated = (step4Data || []).map(item => {
      if (item.id === id) {
        return { ...item, assetLink: newLink };
      }
      return item;
    });
    setStep4Data(updated);
  };

  const handleNameChange = (id, newName) => {
    const updated = (step4Data || []).map(item => {
      if (item.id === id) {
        return { ...item, name: newName };
      }
      return item;
    });
    setStep4Data(updated);
  };

  const saveAllLinks = async () => {
    if (!activeStackId) return;
    try {
      await api.post(`/google-stacks/step4/${activeStackId}`, { step4_data: step4Data });
      showNotification('Đã lưu danh sách Link thủ công thành công!');
    } catch (e) {
      showNotification('Lỗi khi lưu link thủ công', 'error');
    }
  };

  const getLinkValue = (id) => {
    const item = (step4Data || []).find(i => i.id === id);
    return item?.assetLink || '';
  };

  const getKeywordDisplay = (keyType) => {
    if (keyType === 'main_key') return selectedStack?.main_key || 'Key chính';
    if (keyType === 'key_chinh_local') return stackKeywords?.key_chinh_local || 'Key chính + Local';
    return stackKeywords?.[keyType] || keyType;
  };

  const getItemName = (id, defaultName) => {
    const item = (step4Data || []).find(i => i.id === id);
    return item?.name || defaultName;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5">
        <div>
          <h3 className="text-sm font-bold text-white">Quản lý & Nhập Link Tài sản Thủ công</h3>
          <p className="text-[11px] text-amber-400/70 mt-1">⚠️ Vui lòng nhập đầy đủ link cho từng tài sản bên dưới</p>
        </div>
        <button
          onClick={saveAllLinks}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          <Save className="w-4 h-4" /> Lưu tất cả Link thủ công
        </button>
      </div>

      {LINK_SECTIONS.map(sec => {
        const IconComponent = sec.icon;
        const currentLink = getLinkValue(sec.id);
        const keywordText = getKeywordDisplay(sec.keyType);

        if (sec.isSimpleTable) {
          // Section 3: Google site view (Bảng đơn giản)
          return (
            <div key={sec.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                Section 3: Google site view
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <th className="py-2.5 px-3 text-left w-36">Tài sản</th>
                      <th className="py-2.5 px-3 text-left w-48">Key</th>
                      <th className="py-2.5 px-3 text-left">Link cần nhập thủ công</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">Google site view</td>
                      <td className="py-2.5 px-3 text-sky-400 font-medium">{keywordText}</td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={currentLink}
                          onChange={(e) => handleLinkChange(sec.id, e.target.value)}
                          placeholder={sec.placeholder}
                          className="w-full bg-amber-500/5 border border-amber-500/50 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-amber-500/40 hover:border-amber-400/70 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)] focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 focus:outline-none transition-all"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        if (sec.isCustomizable) {
          // Section tùy chọn: Người dùng tự nhập tên tài sản + link
          const customName = getItemName(sec.id, sec.name);
          return (
            <div key={sec.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <IconComponent className={`w-4 h-4 ${sec.color}`} />
                Tài sản tùy chọn (Mạng xã hội / Entity Platform)
              </h4>
              <p className="text-[11px] text-slate-400">Nhập tên nền tảng mong muốn (ví dụ: Linkedin, Pearltree, Tumblr, Reddit...) và dán link tài sản tương ứng. Từ khóa: <span className="text-sky-300 font-semibold">{keywordText}</span></p>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <th className="py-2.5 px-3 text-left w-48">Tên tài sản (nhập tự do)</th>
                      <th className="py-2.5 px-3 text-left">Link tài sản</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => handleNameChange(sec.id, e.target.value)}
                          placeholder="Nhập tên nền tảng..."
                          className="w-full bg-slate-950 border border-indigo-500/30 rounded-xl px-3 py-1.5 text-xs text-indigo-300 font-semibold focus:border-indigo-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={currentLink}
                            onChange={(e) => handleLinkChange(sec.id, e.target.value)}
                            placeholder={sec.placeholder}
                            className="flex-1 bg-amber-500/5 border border-amber-500/50 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-amber-500/40 hover:border-amber-400/70 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)] focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 focus:outline-none transition-all"
                          />
                          {currentLink && (
                            <a
                              href={currentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-slate-950 border border-slate-800 hover:border-sky-500 text-sky-400 rounded-lg transition-colors shrink-0"
                              title="Mở link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        // Section có hướng dẫn từng bước
        return (
          <div key={sec.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <IconComponent className={`w-4 h-4 ${sec.color}`} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Hướng dẫn & Nhập link {sec.name}</h4>
                  <p className="text-[11px] text-slate-400">Từ khóa tương ứng: <span className="text-sky-300 font-semibold">{keywordText}</span></p>
                </div>
              </div>
            </div>

            {/* Tutorial steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sec.steps.map(s => (
                <div key={s.step} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <span className="text-[10px] font-bold text-sky-400 font-mono">Bước {s.step}</span>
                  <p className="text-xs text-slate-300 leading-snug">{s.text}</p>
                  <div 
                    onClick={() => s.img && setZoomImage(s.img)}
                    className="aspect-video bg-slate-900 border border-slate-800/80 rounded-lg flex items-center justify-center cursor-pointer hover:border-sky-500/40 transition-all relative group"
                  >
                    {s.img ? (
                      <img src={s.img} alt={`${sec.name} Step ${s.step}`} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-center p-2">
                        <Eye className="w-4 h-4 text-slate-600 mx-auto mb-1 group-hover:text-sky-400" />
                        <span className="text-[10px] text-slate-600 font-mono">Image Step {s.step} ({s.size})</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Link input area */}
            <div className="pt-3 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-400 tracking-wide">⚠️ NHẬP LINK TẠI ĐÂY</span>
              <div className="flex items-center gap-2">
              <input
                type="text"
                value={currentLink}
                onChange={(e) => handleLinkChange(sec.id, e.target.value)}
                placeholder={`Nhập URL ${sec.name}: ${sec.placeholder}`}
                className="flex-1 bg-amber-500/5 border-2 border-amber-500/50 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder:text-amber-500/40 hover:border-amber-400/70 hover:shadow-[0_0_16px_rgba(245,158,11,0.2)] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition-all"
              />
              {currentLink && (
                <a
                  href={currentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-950 border border-slate-800 hover:border-sky-500 text-sky-400 rounded-xl transition-colors shrink-0"
                  title="Mở link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

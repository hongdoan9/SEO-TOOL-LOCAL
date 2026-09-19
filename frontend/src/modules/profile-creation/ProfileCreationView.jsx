import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Settings, Puzzle, CheckCircle } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import ProfileQueueTable from './components/ProfileQueueTable';
import SchemaManagerModal from './components/SchemaManagerModal';
import ProfileExportModal from './components/ProfileExportModal';
import { getSchemas, saveSchema, seedPresetSchemas, getProfiles, createProfileTask, deleteProfileTask } from './profile.api';

export default function ProfileCreationView() {
  const { selectedProject: currentProject } = useUser();
  const { showNotification } = useNotification();
  const [schemas, setSchemas] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const [schemasData, profilesData] = await Promise.all([
        getSchemas(),
        getProfiles(currentProject.id)
      ]);
      setSchemas(schemasData);
      setProfiles(profilesData);
    } catch (err) {
      showNotification('Không thể tải dữ liệu Module 3.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentProject, showNotification]);

  // Cập nhật ngầm danh sách profiles mà không làm giật giao diện (Silent polling)
  const silentRefreshProfiles = useCallback(async () => {
    if (!currentProject) return;
    try {
      const profilesData = await getProfiles(currentProject.id);
      setProfiles(profilesData);
    } catch (err) {
      // Bỏ qua lỗi ngầm
    }
  }, [currentProject]);

  useEffect(() => {
    loadData();

    // Tự động làm mới trạng thái Hàng đợi mỗi 3 giây
    const interval = setInterval(() => {
      silentRefreshProfiles();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadData, silentRefreshProfiles]);

  const handleCreateTask = async (platform) => {
    if (!currentProject) {
      showNotification('Vui lòng chọn Dự án trước khi tạo Profile.', 'error');
      return;
    }
    try {
      await createProfileTask(currentProject.id, platform);
      showNotification(`Đã thêm nhiệm vụ tạo Profile ${platform.toUpperCase()} vào Hàng đợi.`, 'success');
      loadData();
    } catch (err) {
      showNotification('Không thể thêm nhiệm vụ mới.', 'error');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteProfileTask(id);
      showNotification('Đã xóa nhiệm vụ khỏi hàng đợi.', 'success');
      loadData();
    } catch (err) {
      showNotification('Không thể xóa nhiệm vụ.', 'error');
    }
  };

  const handleSaveSchema = async (schemaData) => {
    try {
      await saveSchema(schemaData);
      showNotification('Đã cập nhật Schema thành công.', 'success');
      loadData();
    } catch (err) {
      showNotification('Không thể lưu Schema.', 'error');
    }
  };

  const handleSeedPresets = async () => {
    try {
      setLoading(true);
      const res = await seedPresetSchemas();
      showNotification(res.message || 'Đã nạp Presets Schemas thành công!', 'success');
      await loadData();
    } catch (err) {
      showNotification('Lỗi khi nạp Presets Schemas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!currentProject) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <p className="text-slate-400">Vui lòng chọn hoặc tạo 1 Dự án ở thanh menu trên cùng để sử dụng Module 3.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Tiêu đề */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-emerald-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <UserPlus className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Module 3: Tạo Profile Social Tự Động
              </h1>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Tự động điền thông tin doanh nghiệp (Brand, Bio, Website, Avatar) từ Module 1 lên các nền tảng Mạng xã hội thông qua Chrome Extension.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
            >
              <Settings className="w-4 h-4 text-sky-400" />
              Cấu Hình Schemas
            </button>
          </div>
        </div>
      </div>

      {/* Hướng dẫn cài đặt Extension */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Puzzle className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs text-slate-300">
            <span className="font-bold text-white">Hướng dẫn Chrome Extension:</span> Tải thư mục <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300">extension</code> vào <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">chrome://extensions</code> (chế độ Developer) để bật Agent tự động.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          <CheckCircle className="w-3.5 h-3.5" /> Sẵn sàng
        </span>
      </div>

      {/* Bảng Hàng đợi Tasks */}
      <ProfileQueueTable
        profiles={profiles}
        schemas={schemas}
        onCreateTask={handleCreateTask}
        onDeleteTask={handleDeleteTask}
        onRefresh={loadData}
        onSeedPresets={handleSeedPresets}
        onOpenExport={() => setIsExportOpen(true)}
        loading={loading}
      />

      {/* Modal Cấu hình JSON Schemas */}
      <SchemaManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schemas={schemas}
        onSaveSchema={handleSaveSchema}
      />

      {/* Modal Xuất Danh sách Links */}
      <ProfileExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        profiles={profiles}
        projectName={currentProject?.name}
      />
    </div>
  );
}

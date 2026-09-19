import React, { useState, useEffect } from 'react';

export default function TaskMonitorView({ projectId, moduleType = null, autoRefreshInterval = 3000 }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState(null);

  const fetchTasks = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const url = `http://localhost:5050/api/system-tasks/project/${projectId}${moduleType ? `?moduleType=${moduleType}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách System Tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const timer = setInterval(fetchTasks, autoRefreshInterval);
    return () => clearInterval(timer);
  }, [projectId, moduleType]);

  const handleDeleteTask = async (taskId) => {
    try {
      await fetch(`http://localhost:5050/api/system-tasks/${taskId}`, { method: 'DELETE' });
      fetchTasks();
    } catch (err) {
      console.error('Lỗi xóa task:', err);
    }
  };

  const handleClearCompleted = async () => {
    try {
      await fetch(`http://localhost:5050/api/system-tasks/clear-completed/${projectId}`, { method: 'POST' });
      fetchTasks();
    } catch (err) {
      console.error('Lỗi dọn dẹp task:', err);
    }
  };

  const getStatusBadge = (status, retryCount) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Hoàn thành</span>;
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1.5 inline-flex">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
            Đang chạy...
          </span>
        );
      case 'failed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">Thất bại</span>;
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-700/60 text-slate-300 border border-slate-600">
            Chờ xử lý {retryCount > 0 ? `(Thử lại ${retryCount})` : ''}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#131b2e] border border-slate-800 rounded-xl p-5 text-slate-200 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            ⚡ Unified Task Monitor Engine
            {loading && <span className="text-xs text-sky-400 font-normal">Đang đồng bộ...</span>}
          </h3>
          <p className="text-xs text-slate-400">Theo dõi tiến độ thực thi tự động của các Module tác vụ</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchTasks}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            🔄 Làm mới
          </button>
          <button
            onClick={handleClearCompleted}
            className="px-3 py-1.5 text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition"
          >
            🧹 Dọn dẹp xong
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          Chưa có tác vụ nào trong hàng đợi hệ thống.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Tác vụ</th>
                <th className="py-2.5 px-3">Module</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-mono text-slate-400">#{task.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{task.task_name}</td>
                  <td className="py-2.5 px-3">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono">
                      {task.module_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">{getStatusBadge(task.status, task.retry_count)}</td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {new Date(task.updated_at || task.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-2">
                    {task.logs && (
                      <button
                        onClick={() => setSelectedLogs(task.logs)}
                        className="text-sky-400 hover:text-sky-300 font-medium"
                      >
                        Log Terminal
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-rose-400 hover:text-rose-300 font-medium"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedLogs && (
        <div className="mt-4 p-3 bg-black/60 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 relative">
          <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-1 text-slate-400">
            <span>💻 Terminal Logs</span>
            <button onClick={() => setSelectedLogs(null)} className="text-slate-400 hover:text-white font-bold">
              ✕ Đóng
            </button>
          </div>
          <pre className="whitespace-pre-wrap max-h-40 overflow-y-auto">{selectedLogs}</pre>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useStack } from '../stack.context';
import api from '../../../services/api';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useProjectData } from '../../../context/ProjectDataContext';

export default function JobProgressTracker() {
  const { activeJobId, setActiveJobId } = useStack();
  const { fetchGoogleStacks } = useProjectData();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Đang khởi tạo...');
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    if (!activeJobId) return;

    setProgress(0);
    setMessage('Đang kết nối tiến trình nền...');
    setStatus('processing');

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/google-stacks/queue/status/${activeJobId}`);
        const data = res.data;
        
        setProgress(data.progress || 0);
        setMessage(data.message || 'Đang xử lý...');
        
        if (data.status === 'success') {
          setStatus('success');
          clearInterval(interval);
          setTimeout(() => {
            setActiveJobId(null);
            fetchGoogleStacks(); // Reload data
          }, 3000);
        } else if (data.status === 'error' || data.status === 'not_found') {
          setStatus('error');
          clearInterval(interval);
          setTimeout(() => setActiveJobId(null), 5000);
        }
      } catch (err) {
        console.error('Lỗi khi lấy tiến trình:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeJobId, setActiveJobId, fetchGoogleStacks]);

  if (!activeJobId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          {status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-sky-400" />}
          {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
          Tiến trình hệ thống
        </h4>
        <span className="text-xs font-mono text-slate-400">{progress}%</span>
      </div>
      
      <div className="p-4 space-y-3">
        <p className="text-xs text-slate-300 line-clamp-2">{message}</p>
        
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${
              status === 'error' ? 'bg-red-500' : 'bg-sky-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

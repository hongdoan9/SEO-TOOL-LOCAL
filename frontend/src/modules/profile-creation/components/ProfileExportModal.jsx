import React, { useState } from 'react';
import { Download, Copy, Check, X, FileText } from 'lucide-react';
import Modal from '../../../shared/components/Modal';

export default function ProfileExportModal({ isOpen, onClose, profiles, projectName }) {
  const [copied, setCopied] = useState(false);

  const completedProfiles = profiles.filter(p => p.status === 'completed' && p.profile_url);

  const handleCopy = () => {
    const text = completedProfiles.map(p => `${p.platform.toUpperCase()}: ${p.profile_url}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    const headers = 'Platform,Profile URL,Created At\n';
    const rows = completedProfiles
      .map(p => `"${p.platform}","${p.profile_url}","${p.created_at}"`)
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Social_Profiles_${projectName || 'Export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xuất Danh Sách Profile Social">
      <div className="space-y-6">
        <p className="text-xs text-slate-400">
          Danh sách các trang Profile Social đã được Extension hoàn thiện thành công cho dự án <span className="font-bold text-sky-400">{projectName}</span>.
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-60 overflow-y-auto font-mono text-xs space-y-2">
          {completedProfiles.length === 0 ? (
            <div className="text-slate-500 text-center py-4">Chưa có Profile nào hoàn thành để xuất.</div>
          ) : (
            completedProfiles.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 text-slate-300">
                <span className="font-bold text-emerald-400">{p.platform.toUpperCase()}</span>
                <a href={p.profile_url} target="_blank" rel="noreferrer" className="truncate text-sky-400 hover:underline">
                  {p.profile_url}
                </a>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={handleCopy}
            disabled={completedProfiles.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold transition-all border border-slate-700"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            {copied ? 'Đã Sao Chép!' : 'Sao Chép Link'}
          </button>

          <button
            onClick={handleDownloadCSV}
            disabled={completedProfiles.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Tải CSV
          </button>
        </div>
      </div>
    </Modal>
  );
}

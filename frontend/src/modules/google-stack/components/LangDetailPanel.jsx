import React from 'react';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useStack } from '../stack.context';
import { getLanguageFullName } from '../../../constants/keywordFields';

function StatusBadge({ status }) {
  if (status === 'success') return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
  if (typeof status === 'string' && status.startsWith('error')) return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
  if (status === 'pending') return <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />;
}

function AssetLink({ url, label }) {
  if (!url) return <span className="text-slate-600 text-[10px]">—</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
       className="text-sky-400 hover:text-sky-300 text-[11px] inline-flex items-center gap-1 hover:underline truncate max-w-[220px]">
      {label} <ExternalLink className="w-3 h-3 flex-shrink-0" />
    </a>
  );
}

const KEY_FIELDS = [
  { key: 'key_chinh', label: 'Key chính' },
  { key: 'key_chinh_local', label: 'Key + Local' },
  ...Array.from({ length: 14 }, (_, i) => ({ key: `lsi_${i + 1}`, label: `LSI ${i + 1}` })),
];
const DOC_FIELDS = Array.from({ length: 10 }, (_, i) => `lsi_${i + 5}`);

export default function LangDetailPanel({ lang }) {
  const { langData, langOptResults, stackKeywords, selectedStack } = useStack();

  const transKeys = langData?.translated_keys?.[lang] || {};
  const langAssets = langData?.assets?.[lang] || {};
  const optResult = langOptResults?.[lang] || {};
  const origKw = stackKeywords || {};
  const mainKey = selectedStack?.main_key || '';

  const hasKeys = Object.keys(transKeys).length > 0;
  const hasAssets = !!langAssets.folder_url;

  if (!hasKeys && !hasAssets) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center">
        <p className="text-xs text-slate-500">
          Chưa có dữ liệu cho <strong>{getLanguageFullName(lang)}</strong> ({lang.toUpperCase()}).
          Nhấn các button ở trên để bắt đầu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Translated Keywords Table */}
      {hasKeys && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/50">
            <h5 className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
              🔤 Từ khóa đã dịch — {getLanguageFullName(lang)}
            </h5>
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="text-slate-500 text-left">
                  <th className="px-3 py-1.5 font-medium w-[90px]">Field</th>
                  <th className="px-3 py-1.5 font-medium">Tiếng Việt</th>
                  <th className="px-3 py-1.5 font-medium">{getLanguageFullName(lang)}</th>
                </tr>
              </thead>
              <tbody>
                {KEY_FIELDS.map(f => {
                  const orig = f.key === 'key_chinh' ? mainKey : (origKw[f.key] || '');
                  const trans = transKeys[f.key] || '';
                  if (!orig && !trans) return null;
                  return (
                    <tr key={f.key} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-3 py-1 text-slate-500 font-mono text-[10px]">{f.label}</td>
                      <td className="px-3 py-1 text-slate-400 truncate max-w-[200px]">{orig || '—'}</td>
                      <td className="px-3 py-1 text-white font-medium truncate max-w-[200px]">{trans || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assets + Links + Optimization Status */}
      {hasAssets && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <h5 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              📁 Tài sản Drive — {getLanguageFullName(lang)}
            </h5>
            {optResult.status && <StatusBadge status={optResult.status} />}
          </div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-slate-500 text-left border-b border-slate-800">
                <th className="px-3 py-1.5 font-medium w-8">#</th>
                <th className="px-3 py-1.5 font-medium">Tài sản</th>
                <th className="px-3 py-1.5 font-medium">Link</th>
                <th className="px-3 py-1.5 font-medium w-14 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Drive Folder */}
              <tr className="border-t border-slate-800/50 hover:bg-slate-800/30 bg-amber-500/5">
                <td className="px-3 py-1.5 text-slate-600">1</td>
                <td className="px-3 py-1.5 text-amber-400 font-medium">📁 Folder</td>
                <td className="px-3 py-1.5"><AssetLink url={langAssets.folder_url} label="Mở Folder" /></td>
                <td className="px-3 py-1.5 text-center"><StatusBadge status={langAssets.folder_url ? 'success' : 'pending'} /></td>
              </tr>

              {/* 10 Google Docs */}
              {DOC_FIELDS.map((field, idx) => {
                const doc = langAssets.docs?.[field] || {};
                const optDoc = optResult.docs?.[field];
                const title = transKeys[field] || origKw[field] || field.toUpperCase();
                return (
                  <tr key={field} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-3 py-1.5 text-slate-600">{idx + 2}</td>
                    <td className="px-3 py-1.5 text-slate-300"><span className="text-blue-400">📄</span> {title}</td>
                    <td className="px-3 py-1.5"><AssetLink url={doc.driveUrl} label={title} /></td>
                    <td className="px-3 py-1.5 text-center"><StatusBadge status={optDoc || doc.status} /></td>
                  </tr>
                );
              })}

              {/* Sheet, Slide, Form, Drawing */}
              {[
                { n: 12, icon: '📊', label: 'Sheet', url: langAssets.sheet_url, status: optResult.sheet_status, color: 'text-green-400' },
                { n: 13, icon: '📊', label: 'Slide', url: langAssets.slide_url, status: optResult.slide_status, color: 'text-orange-400' },
                { n: 14, icon: '📝', label: 'Form', url: langAssets.form_url, status: optResult.form_status, color: 'text-purple-400' },
                { n: 15, icon: '🎨', label: 'Drawing', url: langAssets.drawing_url, status: null, color: 'text-pink-400' },
              ].map(item => (
                <tr key={item.label} className="border-t border-slate-800/50 hover:bg-slate-800/30 bg-slate-900/20">
                  <td className="px-3 py-1.5 text-slate-600">{item.n}</td>
                  <td className={`px-3 py-1.5 font-medium ${item.color}`}>{item.icon} {item.label}</td>
                  <td className="px-3 py-1.5"><AssetLink url={item.url} label={`Mở ${item.label}`} /></td>
                  <td className="px-3 py-1.5 text-center">
                    <StatusBadge status={item.status || (item.url ? 'success' : 'pending')} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {optResult.error && (
            <div className="px-4 py-2 border-t border-red-500/20 bg-red-500/5 text-[10px] text-red-400">
              ⚠️ {optResult.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Globe, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useStack } from '../stack.context';
import { getLanguageFullName } from '../../../constants/keywordFields';
import { handleTranslateKeys, handleCreateLangAssets, handleOptimizeLangAssets } from '../stack.api';
import { useNotification } from '../../../context/NotificationContext';
import LangDetailPanel from '../components/LangDetailPanel';

const LANGUAGES = ['ar', 'hi', 'ru', 'zh', 'en', 'ja', 'de', 'es', 'pt', 'fr', 'bn', 'pl', 'fi', 'ko', 'it'];
const PHASES = [
  { id: 1, langs: LANGUAGES.slice(0, 5), label: 'Phase 1', color: 'purple' },
  { id: 2, langs: LANGUAGES.slice(5, 10), label: 'Phase 2', color: 'violet' },
  { id: 3, langs: LANGUAGES.slice(10, 15), label: 'Phase 3', color: 'fuchsia' },
];

export default function Step6MultiLanguage() {
  const {
    activeStackId, selectedModel,
    isTranslatingKeys, setIsTranslatingKeys,
    isCreatingLangAssets, setIsCreatingLangAssets,
    optimizingPhase, setOptimizingPhase,
    langData, setLangData,
    langOptResults, setLangOptResults,
    setActiveJobId
  } = useStack();

  const { showNotification } = useNotification();
  const [selectedLangTab, setSelectedLangTab] = useState('ar');

  // Derived statuses
  const translateDone = langData?.translated_keys && Object.keys(langData.translated_keys).length > 0;
  const assetsDone = langData?.assets && Object.keys(langData.assets).length > 0;

  const getPhaseStatus = (phaseId) => {
    const langs = PHASES.find(p => p.id === phaseId)?.langs || [];
    const statuses = langs.map(l => langOptResults[l]?.status);
    if (statuses.every(s => s === 'success')) return 'success';
    if (statuses.some(s => s === 'error' || s === 'success')) return 'partial';
    return 'idle';
  };

  // --- Handlers ---
  const onTranslateKeys = async () => {
    if (!activeStackId) return;
    setIsTranslatingKeys(true);
    try {
      const res = await handleTranslateKeys(activeStackId, selectedModel);
      if (res.data?.jobId) setActiveJobId(res.data.jobId);
      showNotification('Tiến trình Dịch thuật từ khóa đã được đưa vào chạy nền!');
    } catch (e) {
      showNotification('Lỗi khi dịch thuật từ khóa', 'error');
    } finally {
      setIsTranslatingKeys(false);
    }
  };

  const onCreateLangAssets = async () => {
    if (!activeStackId) return;
    setIsCreatingLangAssets(true);
    try {
      const res = await handleCreateLangAssets(activeStackId);
      if (res.data?.jobId) setActiveJobId(res.data.jobId);
      showNotification('Tiến trình Tạo tài sản 15 ngôn ngữ đã được đưa vào chạy nền!');
    } catch (e) {
      showNotification('Lỗi khi tạo tài sản đa ngôn ngữ', 'error');
    } finally {
      setIsCreatingLangAssets(false);
    }
  };

  const onOptimizePhase = async (phaseId) => {
    if (!activeStackId) return;
    setOptimizingPhase(prev => ({ ...prev, [phaseId]: true }));
    try {
      const res = await handleOptimizeLangAssets(activeStackId, selectedModel, phaseId);
      if (res.data?.jobId) setActiveJobId(res.data.jobId);
      const names = PHASES.find(p => p.id === phaseId).langs.map(l => l.toUpperCase()).join(', ');
      showNotification(`Tiến trình Viết Docs Phase ${phaseId} (${names}) đã được đưa vào chạy nền!`);
    } catch (e) {
      showNotification(`Lỗi Phase ${phaseId}`, 'error');
    } finally {
      setOptimizingPhase(prev => ({ ...prev, [phaseId]: false }));
    }
  };

  const anyPhaseRunning = Object.values(optimizingPhase).some(v => v);
  const colorMap = { purple: 'bg-purple-500 hover:bg-purple-400', violet: 'bg-violet-500 hover:bg-violet-400', fuchsia: 'bg-fuchsia-500 hover:bg-fuchsia-400' };
  const doneMap = { purple: 'bg-purple-500/20 border border-purple-500/50 text-purple-300', violet: 'bg-violet-500/20 border border-violet-500/50 text-violet-300', fuchsia: 'bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-300' };

  return (
    <div className="space-y-4">
      {/* Header + Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" />
            Hệ thống Dịch thuật & Tạo Tài sản Đa Ngôn ngữ (15 Quốc gia)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Dịch bộ từ khóa, tạo tài sản Google Drive và viết nội dung Docs cho 15 ngôn ngữ quốc tế.
          </p>
        </div>

        {/* Row 1: Dịch + Tạo Assets */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={onTranslateKeys} disabled={isTranslatingKeys}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-colors disabled:opacity-50">
            {isTranslatingKeys ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : translateDone ? <CheckCircle className="w-3.5 h-3.5" /> : null}
            {isTranslatingKeys ? 'Đang dịch...' : translateDone ? 'Đã dịch Từ khóa' : 'Dịch Từ khóa'}
          </button>
          <button onClick={onCreateLangAssets} disabled={isCreatingLangAssets}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors disabled:opacity-50">
            {isCreatingLangAssets ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : assetsDone ? <CheckCircle className="w-3.5 h-3.5" /> : null}
            {isCreatingLangAssets ? 'Đang tạo...' : assetsDone ? 'Đã tạo Assets' : 'Tạo Assets Đa ngôn ngữ'}
          </button>
        </div>

        {/* Row 2: 3 Phase Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-semibold mr-1">Viết Docs:</span>
          {PHASES.map(phase => {
            const isRunning = optimizingPhase[phase.id];
            const status = getPhaseStatus(phase.id);
            const langLabels = `${phase.langs[0].toUpperCase()}→${phase.langs[4].toUpperCase()}`;
            return (
              <button key={phase.id} onClick={() => onOptimizePhase(phase.id)}
                disabled={isRunning || anyPhaseRunning}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs rounded-xl transition-all disabled:opacity-50 ${
                  status === 'success' ? doneMap[phase.color] : `${colorMap[phase.color]} text-slate-950`
                }`}>
                {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : status === 'success' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  : status === 'partial' ? <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> : null}
                {isRunning ? `Đang viết ${phase.label}...`
                  : status === 'success' ? `${phase.label} Done`
                  : `${phase.label} (${langLabels})`}
              </button>
            );
          })}
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-t border-slate-800 pt-3">
          {LANGUAGES.map(code => {
            const optStatus = langOptResults[code]?.status;
            const assetStatus = langData?.assets?.[code]?.status;
            return (
              <button key={code} onClick={() => setSelectedLangTab(code)}
                className={`relative inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-colors ${
                  selectedLangTab === code ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}>
                {code}
                {optStatus === 'success' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                {optStatus === 'error' && <AlertCircle className="w-3 h-3 text-red-400" />}
                {!optStatus && assetStatus === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Panel for Selected Language */}
      <LangDetailPanel lang={selectedLangTab} />

      {/* Summary Grid */}
      {Object.keys(langOptResults).length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng quan 15 ngôn ngữ</h4>
          <div className="grid grid-cols-5 sm:grid-cols-5 lg:grid-cols-15 gap-1.5">
            {LANGUAGES.map(code => {
              const r = langOptResults[code];
              const docsOk = r?.docs ? Object.values(r.docs).filter(v => v === 'success').length : 0;
              return (
                <button key={code} onClick={() => setSelectedLangTab(code)}
                  className={`text-center p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    selectedLangTab === code ? 'border-sky-500 bg-sky-500/10' :
                    r?.status === 'success' ? 'border-emerald-500/30 bg-emerald-500/5' :
                    r?.status === 'error' ? 'border-red-500/30 bg-red-500/5' :
                    'border-slate-800 bg-slate-950'
                  }`}>
                  <div className="text-[10px] font-bold text-white uppercase">{code}</div>
                  {r && <div className={`text-[9px] mt-0.5 ${docsOk === 10 ? 'text-emerald-400' : 'text-slate-500'}`}>{docsOk}/10</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { X, Save, Code, Check } from 'lucide-react';

export default function SchemaManagerModal({ isOpen, onClose, schemas, onSaveSchema }) {
  const [selectedPlatform, setSelectedPlatform] = useState(schemas[0]?.platform || 'medium');
  const selectedSchema = schemas.find(s => s.platform === selectedPlatform);
  const [jsonText, setJsonText] = useState(
    selectedSchema ? JSON.stringify(selectedSchema.schema_json, null, 2) : ''
  );
  const [saveStatus, setSaveStatus] = useState('');

  if (!isOpen) return null;

  const handleSelectPlatform = (platform) => {
    setSelectedPlatform(platform);
    const found = schemas.find(s => s.platform === platform);
    setJsonText(found ? JSON.stringify(found.schema_json, null, 2) : '');
    setSaveStatus('');
  };

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      await onSaveSchema({
        platform: selectedPlatform,
        name: selectedSchema?.name || selectedPlatform,
        schema_json: parsed
      });
      setSaveStatus('Lưu Schema thành công!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      alert('Cú pháp JSON không hợp lệ: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold">
            <Code className="w-5 h-5 text-sky-400" />
            <span>Quản Lý Social Schemas (JSON Selectors)</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="flex gap-2">
            {schemas.map(s => (
              <button
                key={s.platform}
                onClick={() => handleSelectPlatform(s.platform)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedPlatform === s.platform
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">
              Cấu hình JSON Schema cho {selectedPlatform.toUpperCase()}:
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={16}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-sky-300 focus:outline-none focus:border-sky-500 leading-relaxed"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
            {saveStatus && <><Check className="w-4 h-4" /> {saveStatus}</>}
          </span>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
            >
              Đóng
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-slate-950 hover:bg-sky-400 text-xs font-bold shadow-lg shadow-sky-500/20"
            >
              <Save className="w-4 h-4" />
              Lưu Schema
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

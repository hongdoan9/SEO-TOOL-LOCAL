import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Notification({ message, type = 'success' }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-4 fade-in duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${
        type === 'success' 
          ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' 
          : 'bg-rose-950/90 border-rose-500/30 text-rose-400'
      } backdrop-blur-md`}>
        {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        <span className="text-sm font-semibold">{message}</span>
      </div>
    </div>
  );
}

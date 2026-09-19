import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {onSubmit ? (
          <form onSubmit={onSubmit} className="space-y-4">
            {children}
          </form>
        ) : (
          <div className="space-y-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

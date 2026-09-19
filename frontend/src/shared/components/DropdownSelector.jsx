import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';

/**
 * DropdownSelector — Custom dropdown with per-item delete button.
 * Replaces native <select> to allow delete actions on each item.
 * 
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {Array} props.items - Array of { id, name } objects
 * @param {Object|null} props.selectedItem - Currently selected item
 * @param {Function} props.onSelect - Called with item when selected
 * @param {Function} props.onDelete - Called with item id to delete
 * @param {Function} props.onCreateClick - Opens create modal
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.accentColor - "sky" or "emerald"
 */
export default function DropdownSelector({
  icon: Icon,
  items = [],
  selectedItem,
  onSelect,
  onDelete,
  onCreateClick,
  placeholder = 'Chọn...',
  accentColor = 'sky',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hoverColor = accentColor === 'sky' ? 'hover:text-sky-400' : 'hover:text-emerald-400';
  const accentBg = accentColor === 'sky' ? 'bg-sky-500' : 'bg-emerald-500';
  const accentHoverBg = accentColor === 'sky' ? 'hover:bg-sky-400' : 'hover:bg-emerald-400';
  const accentBorder = accentColor === 'sky' ? 'border-sky-500/30' : 'border-emerald-500/30';

  const handleSelect = (item) => {
    onSelect(item);
    setIsOpen(false);
  };

  const handleDelete = (e, itemId) => {
    e.stopPropagation();
    onDelete(itemId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
        {/* Icon */}
        <div className="pl-2 pr-1 flex items-center text-slate-500">
          <Icon className="w-3.5 h-3.5" />
        </div>

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 bg-transparent text-xs text-white font-medium py-1.5 pl-1 pr-2 cursor-pointer w-32 truncate text-left"
        >
          <span className="truncate flex-1">
            {selectedItem?.name || placeholder}
          </span>
          <ChevronDown className={`w-3 h-3 text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Divider + Create button */}
        <div className="w-[1px] h-4 bg-slate-800 mx-1"></div>
        <button
          type="button"
          onClick={onCreateClick}
          className={`p-1.5 text-slate-400 ${hoverColor} hover:bg-slate-900 rounded-lg transition-colors`}
          title="Tạo mới"
        >
          <Plus className="w-3.5 h-3.5 font-bold" />
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className={`absolute top-full right-0 mt-1.5 w-56 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150`}>
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {placeholder.replace('Chọn ', '').replace('...', '')} ({items.length})
            </p>
          </div>

          {/* Items list */}
          <div className="max-h-48 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-700">
            {items.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500 text-center italic">
                Chưa có dữ liệu
              </div>
            ) : (
              items.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`group flex items-center justify-between px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? `bg-slate-800/80 ${accentBorder} border`
                        : 'hover:bg-slate-800/50 border border-transparent'
                    }`}
                    onClick={() => handleSelect(item)}
                  >
                    <span className={`text-xs font-medium truncate flex-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.id)}
                      className="ml-2 p-1 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-150 shrink-0"
                      title={`Xóa "${item.name}"`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: create button */}
          <div className="border-t border-slate-800 p-1.5">
            <button
              type="button"
              onClick={() => { onCreateClick(); setIsOpen(false); }}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${accentBg} text-slate-950 ${accentHoverBg} transition-colors`}
            >
              <Plus className="w-3 h-3" />
              Tạo mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

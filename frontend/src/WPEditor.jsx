import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Link, List, ListOrdered, Trash2, Eye, Code } from 'lucide-react';

function WPEditor({ value = '', onChange, placeholder = 'Nhập nội dung...' }) {
  const [isVisual, setIsVisual] = useState(true);
  const [htmlContent, setHtmlContent] = useState(value);
  const editorRef = useRef(null);

  // Đồng bộ giá trị từ ngoài vào khi thay đổi dự án
  useEffect(() => {
    if (value !== htmlContent) {
      setHtmlContent(value);
      if (editorRef.current && isVisual) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  // Khi component mount và ở chế độ Visual, set innerHTML ban đầu
  useEffect(() => {
    if (editorRef.current && isVisual) {
      editorRef.current.innerHTML = htmlContent;
    }
  }, [isVisual]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setHtmlContent(content);
      if (onChange) onChange(content);
    }
  };

  const handleTextareaChange = (e) => {
    const content = e.target.value;
    setHtmlContent(content);
    if (onChange) onChange(content);
  };

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const handleAddLink = () => {
    const url = prompt('Nhập URL liên kết:', 'https://');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950 flex flex-col min-h-[220px]">
      
      {/* Editor Header / Tabs & Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/40 px-3 py-2 select-none">
        
        {/* Nút định dạng nhanh (Chỉ hiển thị ở tab Visual) */}
        <div className="flex items-center gap-1">
          {isVisual ? (
            <>
              <button
                type="button"
                onClick={() => executeCommand('bold')}
                className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                title="Bôi đậm"
              >
                <Bold size={16} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand('italic')}
                className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                title="In nghiêng"
              >
                <Italic size={16} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand('underline')}
                className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                title="Gạch chân"
              >
                <Underline size={16} />
              </button>
              <div className="w-px h-5 bg-slate-800 mx-1"></div>
              <button
                type="button"
                onClick={handleAddLink}
                className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                title="Chèn link"
              >
                <Link size={16} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand('insertUnorderedList')}
                className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                title="Danh sách dấu chấm"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand('insertOrderedList')}
                className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                title="Danh sách số"
              >
                <ListOrdered size={16} />
              </button>
              <div className="w-px h-5 bg-slate-800 mx-1"></div>
              <button
                type="button"
                onClick={() => executeCommand('removeFormat')}
                className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Xóa định dạng"
              >
                <Trash2 size={16} />
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-500 font-medium px-2 py-1">Chế độ sửa mã HTML thô</span>
          )}
        </div>

        {/* Tab chuyển đổi Visual / Text */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setIsVisual(true)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-all ${
              isVisual
                ? 'bg-slate-850 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye size={12} /> Visual
          </button>
          <button
            type="button"
            onClick={() => setIsVisual(false)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-all ${
              !isVisual
                ? 'bg-slate-850 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code size={12} /> Text (HTML)
          </button>
        </div>

      </div>

      {/* Editor Body */}
      <div className="flex-1 flex flex-col bg-slate-950/40 relative">
        
        {isVisual ? (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="flex-1 p-4 min-h-[160px] outline-none text-slate-200 text-sm leading-relaxed prose prose-invert max-w-none focus:bg-slate-900/10"
            style={{
              fontFamily: 'ui-sans-serif, system-ui, sans-serif'
            }}
          />
        ) : (
          <textarea
            value={htmlContent}
            onChange={handleTextareaChange}
            placeholder="Nhập mã HTML..."
            className="flex-1 p-4 min-h-[160px] w-full bg-slate-950 text-slate-300 font-mono text-xs leading-relaxed outline-none border-none resize-y focus:bg-slate-900/10"
          />
        )}

        {/* Placeholder (Chỉ hiển thị ở Visual khi trống) */}
        {isVisual && !htmlContent && (
          <div className="absolute top-4 left-4 text-sm text-slate-650 pointer-events-none select-none">
            {placeholder}
          </div>
        )}

      </div>

    </div>
  );
}

export default WPEditor;

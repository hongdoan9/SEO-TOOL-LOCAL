import React from 'react';
import WPEditor from '../../../WPEditor';
import { useStack } from '../stack.context';

export default function Step5WPEditor() {
  const { wpTitle, setWpTitle, wpContent, setWpContent } = useStack();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-bold text-white">Trình biên tập Đăng bài WordPress (WPEditor)</h3>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Tiêu đề bài viết WordPress</label>
        <input
          type="text"
          value={wpTitle || ''}
          onChange={(e) => setWpTitle(e.target.value)}
          placeholder="Tiêu đề chuẩn SEO..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Nội dung bài viết (Visual / Text HTML)</label>
        <WPEditor
          value={wpContent || ''}
          onChange={(content) => setWpContent(content)}
          placeholder="Nhập nội dung bài viết..."
        />
      </div>
    </div>
  );
}

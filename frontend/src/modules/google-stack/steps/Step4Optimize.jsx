import React from 'react';
import { FileText, FileCode, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { useStack } from '../stack.context';
import { handleOptimizeDocs, handleOptimizePdf, handleOptimizeSheet } from '../stack.api';
import { useNotification } from '../../../context/NotificationContext';

import OptimizedLinksTable from '../components/OptimizedLinksTable';

export default function Step4Optimize() {
  const { 
    activeStackId, selectedModel,
    isOptimizingDocs, setIsOptimizingDocs,
    isOptimizingPdf, setIsOptimizingPdf,
    isOptimizingSheet, setIsOptimizingSheet,
    optimizeResults,
    pdfResults, setPdfResults,
    sheetOptimizeResult, setSheetOptimizeResult,
    setActiveJobId
  } = useStack();
  
  const { showNotification } = useNotification();

  const onOptimizeDocs = async () => {
    if (!activeStackId || isOptimizingDocs) return;
    setIsOptimizingDocs(true);
    try {
      const res = await handleOptimizeDocs(activeStackId, selectedModel);
      if (res.data?.jobId) setActiveJobId(res.data.jobId);
      showNotification('Tiến trình Tối ưu hóa Docs đã được đưa vào chạy nền!');
    } catch (e) {
      showNotification('Lỗi khi tối ưu nội dung Docs', 'error');
    } finally {
      setIsOptimizingDocs(false);
    }
  };

  const onOptimizePdf = async () => {
    if (!activeStackId || isOptimizingPdf) return;
    setIsOptimizingPdf(true);
    try {
      const res = await handleOptimizePdf(activeStackId, selectedModel);
      setPdfResults(res.data.pdfResults || []);
      showNotification('Xuất PDF và tạo comment Entity thành công!');
    } catch (e) {
      showNotification('Lỗi khi tối ưu PDF', 'error');
    } finally {
      setIsOptimizingPdf(false);
    }
  };

  const onOptimizeSheet = async () => {
    if (!activeStackId || isOptimizingSheet) return;
    setIsOptimizingSheet(true);
    try {
      const res = await handleOptimizeSheet(activeStackId, selectedModel);
      setSheetOptimizeResult(res.data);
      showNotification('Tối ưu hóa Google Sheet thành công!');
    } catch (e) {
      showNotification('Lỗi khi tối ưu Google Sheet', 'error');
    } finally {
      setIsOptimizingSheet(false);
    }
  };

  const docsOptimized = optimizeResults && optimizeResults.length > 0;
  const pdfOptimized = pdfResults && pdfResults.length > 0;
  const sheetOptimized = sheetOptimizeResult !== null;
  const isAnyOptimizing = isOptimizingDocs || isOptimizingPdf || isOptimizingSheet;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-bold text-white">Tối ưu lần lượt các tài sản Google</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          {/* Nút 1: Tối ưu Docs */}
          <button
            onClick={onOptimizeDocs}
            disabled={isAnyOptimizing}
            className={`p-4 bg-slate-950 border rounded-xl text-left space-y-2 transition-all group disabled:opacity-50 disabled:cursor-not-allowed ${
              docsOptimized ? 'border-sky-500/50 shadow-[0_0_12px_rgba(14,165,233,0.1)]' : 'border-slate-800 hover:border-sky-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                {isOptimizingDocs && <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />}
              </div>
              {docsOptimized && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã tối ưu
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-white flex items-center justify-between">
              <span>1. Tối ưu Google Docs</span>
              {isOptimizingDocs && <span className="text-[10px] text-sky-400 font-medium">Đang xử lý...</span>}
            </h4>
            <p className="text-[11px] text-slate-400">Tự động viết nội dung chuẩn SEO cho từng file Docs.</p>
          </button>

          {/* Nút 2: Tạo và Tối ưu PDF */}
          <button
            onClick={onOptimizePdf}
            disabled={isAnyOptimizing}
            className={`p-4 bg-slate-950 border rounded-xl text-left space-y-2 transition-all group disabled:opacity-50 disabled:cursor-not-allowed ${
              pdfOptimized ? 'border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.1)]' : 'border-slate-800 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                {isOptimizingPdf && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />}
              </div>
              {pdfOptimized && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã tối ưu
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-white flex items-center justify-between">
              <span>2. Tạo và Tối ưu PDF</span>
              {isOptimizingPdf && <span className="text-[10px] text-emerald-400 font-medium">Đang xử lý...</span>}
            </h4>
            <p className="text-[11px] text-slate-400">Xuất file PDF và gửi comment Entity lên Google Drive.</p>
          </button>

          {/* Nút 3: Tối ưu Sheet, Slide, Form */}
          <button
            onClick={onOptimizeSheet}
            disabled={isAnyOptimizing}
            className={`p-4 bg-slate-950 border rounded-xl text-left space-y-2 transition-all group disabled:opacity-50 disabled:cursor-not-allowed ${
              sheetOptimized ? 'border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.1)]' : 'border-slate-800 hover:border-purple-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                {isOptimizingSheet && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
              </div>
              {sheetOptimized && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã tối ưu
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-white flex items-center justify-between">
              <span>3. Tối ưu Sheet, Slide, Form, File upload</span>
              {isOptimizingSheet && <span className="text-[10px] text-purple-400 font-medium">Đang xử lý...</span>}
            </h4>
            <p className="text-[11px] text-slate-400">Ghi danh sách từ khóa & liên kết vào trang tính.</p>
          </button>
        </div>
      </div>

      {/* Bảng tổng hợp các Link đã được tối ưu */}
      <OptimizedLinksTable />
    </div>
  );
}

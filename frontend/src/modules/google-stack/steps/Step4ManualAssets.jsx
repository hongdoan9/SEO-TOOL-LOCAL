import React, { useEffect } from 'react';
import { FileCheck } from 'lucide-react';
import { useStack } from '../stack.context';
import ManualSectionUploads from '../components/ManualSectionUploads';
import ManualSectionLinks from '../components/ManualSectionLinks';
import api from '../../../services/api';

export default function Step4ManualAssets() {
  const { activeStackId, step4Data, setStep4Data } = useStack();

  useEffect(() => {
    if (activeStackId && (!step4Data || step4Data.length === 0)) {
      api.get(`/google-stacks/step4/${activeStackId}`)
        .then(res => {
          if (res.data.step4_data) {
            setStep4Data(res.data.step4_data);
          }
        })
        .catch(console.error);
    }
  }, [activeStackId, step4Data, setStep4Data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-sky-400" />
          Bước 4: Tạo thủ công và nhập link
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Hướng dẫn chi tiết từng bước tạo tài sản và upload file / nhập link thủ công cho dự án. Các link này sẽ làm Entity Backlink nguyên liệu cho bước 5 (Tối ưu AI).
        </p>
      </div>

      {/* All sections rendered continuously */}
      <ManualSectionUploads />
      <ManualSectionLinks />
    </div>
  );
}

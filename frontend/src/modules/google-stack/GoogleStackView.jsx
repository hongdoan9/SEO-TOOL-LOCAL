import React, { useState } from 'react';
import { Layers, Plus, ArrowLeft, FolderOpen } from 'lucide-react';
import { useStack } from './stack.context';
import { useProjectData } from '../../context/ProjectDataContext';
import { useUser } from '../../context/UserContext';
import StackOverview from './components/StackOverview';
import CreateStackModal from './components/CreateStackModal';
import TabNavigation from '../../shared/components/TabNavigation';
import { GOOGLE_STACK_STEPS } from './stack.registry';
import JobProgressTracker from './components/JobProgressTracker';

export default function GoogleStackView() {
  const { selectedProject } = useUser();
  const { googleStacks } = useProjectData();
  const { activeStackId, setActiveStackId, selectedStack } = useStack();
  
  const [activeSubTab, setActiveSubTab] = useState('prep');
  const [showCreateStackModal, setShowCreateStackModal] = useState(false);

  if (!selectedProject) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <Layers className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Chưa chọn dự án</h3>
        <p className="text-xs text-slate-400">Vui lòng chọn một Dự án ở menu trên để xem danh sách Google Entity Stacks.</p>
      </div>
    );
  }

  if (!activeStackId || !selectedStack) {
    return (
      <div className="space-y-6 pb-12">
        <StackOverview onOpenCreateModal={() => setShowCreateStackModal(true)} />
        <CreateStackModal isOpen={showCreateStackModal} onClose={() => setShowCreateStackModal(false)} />
      </div>
    );
  }

  const ActiveStepComponent = GOOGLE_STACK_STEPS.find(step => step.id === activeSubTab)?.component || GOOGLE_STACK_STEPS[0].component;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation Bar with Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveStackId(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" /> Quay lại Danh sách Stacks
          </button>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] uppercase border border-emerald-500/20">V2 Engine</span>
              <span className="text-sky-400">Stack #{selectedStack.id}:</span> {selectedStack.brand || selectedStack.main_key}
            </h2>
            <p className="text-[11px] text-slate-400">
              Key chính: <span className="text-emerald-400 font-semibold">{selectedStack.main_key}</span> | URL: {selectedStack.url}
            </p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <FolderOpen className="w-3 h-3 text-amber-400" />
              Drive: <a href={selectedStack.drive_folder} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline truncate max-w-[300px]">{selectedStack.drive_folder}</a>
            </p>
          </div>
        </div>

        {/* Stack Dropdown Switcher */}
        <div className="flex items-center gap-2">
          <select
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer min-w-[200px]"
            value={activeStackId || ''}
            onChange={(e) => setActiveStackId(e.target.value ? parseInt(e.target.value) : null)}
          >
            {googleStacks.map(s => (
              <option key={s.id} value={s.id}>
                Stack #{s.id}: {s.brand || s.main_key || s.url}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateStackModal(true)}
            className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-colors shrink-0"
            title="Tạo Stack mới"
          >
            <Plus className="w-4 h-4 font-bold" />
          </button>
        </div>
      </div>

      <JobProgressTracker />

      <TabNavigation tabs={GOOGLE_STACK_STEPS} activeTab={activeSubTab} onTabChange={setActiveSubTab} />

      <ActiveStepComponent />

      <CreateStackModal isOpen={showCreateStackModal} onClose={() => setShowCreateStackModal(false)} />
    </div>
  );
}

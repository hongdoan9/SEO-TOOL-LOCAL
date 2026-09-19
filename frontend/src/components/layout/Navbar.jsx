import React, { useState } from 'react';
import { Menu, User, FolderGit2 } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import Modal from '../../shared/components/Modal';
import DropdownSelector from '../../shared/components/DropdownSelector';

export default function Navbar({ isSidebarOpen, setIsSidebarOpen }) {
  const { 
    users, selectedUser, setSelectedUser,
    projects, selectedProject, setSelectedProject,
    handleCreateUser, handleDeleteUser,
    handleCreateProject, handleDeleteProject
  } = useUser();

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');

  const onUserSubmit = (e) => {
    e.preventDefault();
    if (newUserName.trim()) {
      handleCreateUser(newUserName);
      setNewUserName('');
      setShowCreateUser(false);
    }
  };

  const onProjectSubmit = (e) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      handleCreateProject(newProjectName, '');
      setNewProjectName('');
      setShowCreateProject(false);
    }
  };

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 h-16 shrink-0 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md">
              v1.0.0
            </span>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
              STABLE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* User Selector */}
          <DropdownSelector
            icon={User}
            items={users}
            selectedItem={selectedUser}
            onSelect={setSelectedUser}
            onDelete={handleDeleteUser}
            onCreateClick={() => setShowCreateUser(true)}
            placeholder="Chọn User..."
            accentColor="sky"
          />

          {/* Project Selector */}
          {selectedUser && (
            <DropdownSelector
              icon={FolderGit2}
              items={projects}
              selectedItem={selectedProject}
              onSelect={setSelectedProject}
              onDelete={handleDeleteProject}
              onCreateClick={() => setShowCreateProject(true)}
              placeholder="Chọn Dự án..."
              accentColor="emerald"
            />
          )}
        </div>
      </header>

      <Modal isOpen={showCreateUser} onClose={() => setShowCreateUser(false)} title="Tạo User Mới" onSubmit={onUserSubmit}>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Tên User</label>
          <input
            type="text"
            required
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => setShowCreateUser(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800">Hủy</button>
          <button type="submit" className="px-4 py-2 rounded-xl text-xs font-medium bg-sky-500 text-slate-950 font-bold hover:bg-sky-400">Tạo</button>
        </div>
      </Modal>

      <Modal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} title="Tạo Dự án Mới" onSubmit={onProjectSubmit}>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Tên Dự án</label>
          <input
            type="text"
            required
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => setShowCreateProject(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800">Hủy</button>
          <button type="submit" className="px-4 py-2 rounded-xl text-xs font-medium bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400">Tạo</button>
        </div>
      </Modal>
    </>
  );
}

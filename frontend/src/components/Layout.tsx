import React, { useState } from 'react';
import { useParams, Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, FileText, HardHat, DollarSign, AlertTriangle, FolderOpen, Menu, X, ChevronLeft, UserCircle } from 'lucide-react';
import { UserRole } from '../types';

const Layout: React.FC = () => {
  const { projectId } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const currentRole = localStorage.getItem('currentRole') as UserRole || 'ENGINEER';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'master', label: 'Master Control', icon: FileText },
    { id: 'site', label: 'Site Execution', icon: HardHat },
    { id: 'finance', label: 'Financial Control', icon: DollarSign },
    { id: 'liability', label: 'Liability Tracker', icon: AlertTriangle },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
  ];

  if (!projectId) return <Navigate to="/projects" />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden lg:block w-72 bg-white border-r h-screen fixed">
        {/* Logo + Project Info */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">B</div>
            <div>
              <div className="font-bold text-2xl tracking-tight">BuildTrack</div>
              <div className="text-xs text-slate-500">AI Project Management</div>
            </div>
          </div>
        </div>

        <nav className="p-6 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-6 lg:p-10">
        <Outlet context={{ currentRole, projectId }} />
      </main>
    </div>
  );
};

export default Layout;

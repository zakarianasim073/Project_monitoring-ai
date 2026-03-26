import React, { useState, useEffect } from 'react';
import { Building2, PlusCircle, Lock, Flag, ArrowRight, UserCircle } from 'lucide-react';
import { ProjectState, UserRole, Priority } from '../types';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface ProjectListProps {
  onSwitchRole: (role: UserRole) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onSwitchRole }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const currentUserRole = localStorage.getItem('currentRole') || 'ENGINEER';

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await api.getMyProjects();
        setProjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const handleSelectProject = (project: any) => {
    localStorage.setItem('currentProjectId', project.id);
    localStorage.setItem('currentRole', project.myRole || 'ENGINEER');
    navigate(`/project/${project.id}`);
  };

  const getPriorityColor = (p: Priority) => {
    switch(p) {
      case 'HIGH': return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">My Projects</h1>
          <p className="text-slate-500 mt-2">Select a project to continue</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <button className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-2xl hover:border-blue-400">
              <UserCircle className="w-6 h-6" />
              <span className="font-medium">{currentUserRole}</span>
            </button>
            {/* Role switcher dropdown */}
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl hidden group-hover:block z-50">
              {(['DIRECTOR', 'MANAGER', 'ENGINEER', 'ACCOUNTANT'] as UserRole[]).map(role => (
                <button key={role} onClick={() => onSwitchRole(role)} className="w-full text-left px-6 py-3 hover:bg-slate-50">
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj: any) => (
          <div
            key={proj.id}
            onClick={() => handleSelectProject(proj)}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
          >
            <div className="p-8">
              <div className="flex justify-between mb-6">
                <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
                  <Building2 className="w-8 h-8" />
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getPriorityColor(proj.priority)}`}>
                  {proj.priority}
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-4 line-clamp-2">{proj.name}</h3>

              <div className="space-y-3 text-sm text-slate-600">
                <div>৳{(proj.contractValue / 1000000).toFixed(2)} Million</div>
                <div>{proj.startDate} → {proj.endDate}</div>
                <div>{proj.boq?.length || 0} BOQ Items</div>
              </div>
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t flex justify-between items-center group-hover:bg-blue-50">
              <span className="font-medium text-slate-600 group-hover:text-blue-600">Open Project</span>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectList;

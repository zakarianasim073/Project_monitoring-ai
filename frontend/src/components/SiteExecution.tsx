import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ProjectState, DPR, MaterialConsumption, UserRole } from '../types';
import { api } from '../services/api';
import DocumentManager from './DocumentManager';
import { MapPin, Users, Calendar, PlusCircle, X, ClipboardCheck, Lock, Sparkles, Loader2, FileText, CheckCircle2, Package, ArrowDownLeft, Edit2, Save, HardHat } from 'lucide-react';

const SiteExecution: React.FC = () => {
  const { currentRole, projectId } = useOutletContext<{ currentRole: UserRole; projectId: string }>();
  const [data, setData] = useState<ProjectState | null>(null); // In real app use TanStack Query

  const canAddDPR = currentRole === 'ENGINEER' || currentRole === 'DIRECTOR';
  const canManageStore = currentRole === 'ENGINEER' || currentRole === 'MANAGER' || currentRole === 'DIRECTOR';
  const isDirector = currentRole === 'DIRECTOR';

  // ... (keep all your existing state and logic for DPR modal, receive modal, AI autofill, etc.)

  const handleCreateDPR = async (newDPR: DPR) => {
    const result = await api.addDPR(projectId, newDPR);
    // refresh data or optimistic update
    alert('DPR saved successfully!');
  };

  // Same for receiveMaterial, updateRemarks, etc. — use api calls

  return (
    <div className="space-y-8">
      {/* Your original header with role check */}
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Execution</h1>
          <p className="text-slate-500">Current Role: <span className="font-semibold text-blue-600">{currentRole}</span></p>
        </div>
        {canAddDPR ? (
          <button onClick={() => setIsDprModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" /> Add Daily Progress
          </button>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 bg-slate-100 px-6 py-3 rounded-2xl">
            <Lock className="w-5 h-5" /> Read Only Mode
          </div>
        )}
      </div>

      {/* Rest of your original SiteExecution UI remains exactly the same */}
      {/* Just make sure all action buttons check currentRole before showing */}

      {/* DPR Modal, Receive Modal, etc. — keep your beautiful UI */}
    </div>
  );
};

export default SiteExecution;

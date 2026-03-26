import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { ProjectState, UserRole } from '../types';
import { AlertTriangle, Clock, Lock } from 'lucide-react';
import { api } from '../services/api';
import DocumentManager from './DocumentManager';

const LiabilityTracker: React.FC = () => {
  const { currentRole, projectId } = useOutletContext<{ currentRole: UserRole; projectId: string }>();
  const [data, setData] = useState<ProjectState | null>(null);

  const canEdit = currentRole === 'DIRECTOR' || currentRole === 'ACCOUNTANT';

  return (
    <div className="space-y-8">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">Liability Tracker</h1>
          <p className="text-slate-500">Role: {currentRole}</p>
        </div>
      </div>

      {/* Your KPI cards for Retention, Pending PO, Unbilled */}

      <div className="bg-white rounded-3xl border p-8">
        <h3 className="font-semibold text-xl mb-6">Detailed Liability Ledger</h3>
        {/* Your table */}
      </div>

      <DocumentManager 
        documents={data?.documents || []} 
        onAddDocument={(doc) => api.addDocument(projectId, doc)}
        filterModule="LIABILITY" 
        compact={true} 
        allowUpload={canEdit}
      />
    </div>
  );
};

export default LiabilityTracker;

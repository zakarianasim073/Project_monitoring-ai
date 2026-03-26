import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ProjectState, UserRole } from '../types';
import { Download, PlusCircle, Sparkles, Loader2, Wallet, ArrowDownRight, Package, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import DocumentManager from './DocumentManager';

const FinancialControl: React.FC = () => {
  const { currentRole, projectId } = useOutletContext<{ currentRole: UserRole; projectId: string }>();
  const [data, setData] = useState<ProjectState | null>(null);

  const canAddClientBill = currentRole === 'MANAGER' || currentRole === 'DIRECTOR';
  const canAddVendorBill = currentRole === 'ACCOUNTANT' || currentRole === 'DIRECTOR';

  // ... your existing bill form state

  const handleCreateBill = async (billData: any) => {
    await api.addBill(projectId, billData);
    alert('Bill recorded successfully!');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Control</h1>
          <p className="text-slate-500">Role: {currentRole}</p>
        </div>
        <div className="flex gap-3">
          {canAddVendorBill && (
            <button onClick={() => { /* open modal */ }} className="flex items-center gap-2 bg-white border px-5 py-3 rounded-2xl">
              <PlusCircle className="w-5 h-5" /> Add Expense
            </button>
          )}
          {canAddClientBill && (
            <button onClick={() => { /* open modal */ }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2">
              Record Client Bill
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards - keep your original */}
      {/* Unit Cost Table - keep your original but disable edit for Engineer */}
      {/* Bill Tables */}

      <DocumentManager 
        documents={data?.documents || []} 
        onAddDocument={(doc) => api.addDocument(projectId, doc)}
        filterModule="FINANCE" 
        compact={false}
        allowUpload={canAddClientBill || canAddVendorBill}
      />
    </div>
  );
};

export default FinancialControl;

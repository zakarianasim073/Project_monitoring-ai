import React, { useState } from 'react';
import { UploadCloud, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

const SmartUploadModal = ({ projectId, isOpen, onClose, onSuccess }: any) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSmartUpload = async () => {
    if (!file) return;
    setProcessing(true);

    // In real app: first upload file to backend, get filename, then call smart-upload
    const filename = file.name;

    const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/documents/smart-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ fileName: filename, fileType: file.type })
    });

    const data = await res.json();
    setResult(data);
    setProcessing(false);

    if (data.success) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
      <div className="bg-white rounded-3xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Sparkles className="text-emerald-600" /> Smart Document Import
        </h2>

        <div className="border-2 border-dashed rounded-2xl p-10 text-center">
          <input type="file" accept=".pdf,.xlsx,.xls,.docx" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="smart-file" />
          <label htmlFor="smart-file" className="cursor-pointer block">
            <UploadCloud className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <p className="font-medium">Drop PDF, Excel or Word file</p>
            <p className="text-sm text-slate-500">AI will auto-detect and place data</p>
          </label>
        </div>

        {file && <p className="mt-4 text-sm text-center text-emerald-600">{file.name}</p>}

        <button 
          onClick={handleSmartUpload}
          disabled={!file || processing}
          className="mt-8 w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-300"
        >
          {processing ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {processing ? "AI Analyzing & Placing..." : "Smart Import Now"}
        </button>
      </div>
    </div>
  );
};

export default SmartUploadModal;

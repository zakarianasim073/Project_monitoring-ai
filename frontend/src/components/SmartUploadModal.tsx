import React, { useState } from 'react';
import { UploadCloud, Loader2, Sparkles, CheckCircle2, X } from 'lucide-react';
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
        onSuccess(data);
        onClose();
      }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-upload-title"
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="smart-upload-title" className="text-2xl font-bold mb-6 flex items-center gap-3">
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

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSmartUpload}
            disabled={!file || processing}
            className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-300 transition-all"
          >
            {processing ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {processing ? "AI Analyzing & Placing..." : "Smart Import Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartUploadModal;

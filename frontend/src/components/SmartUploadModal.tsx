import React, { useState, useEffect } from 'react';
import { UploadCloud, Loader2, Sparkles, CheckCircle2, X, FileText } from 'lucide-react';
import { api } from '../services/api';

const SmartUploadModal = ({ projectId, isOpen, onClose, onSuccess }: any) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {result?.success ? (
          <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Upload Successful!</h3>
            <p className="text-slate-500">AI has processed and placed your document.</p>
          </div>
        ) : (
          <>
            <h2 id="modal-title" className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Sparkles className="text-emerald-600" /> Smart Document Import
            </h2>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-emerald-400 transition-colors focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.docx"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="sr-only"
                id="smart-file"
              />
              <label htmlFor="smart-file" className="cursor-pointer block group">
                <UploadCloud className="w-16 h-16 mx-auto text-slate-400 mb-4 group-hover:text-emerald-500 transition-colors" />
                <p className="font-medium text-slate-700">Drop PDF, Excel or Word file</p>
                <p className="text-sm text-slate-500 mt-1">AI will auto-detect and place data</p>
              </label>
            </div>

            {file && (
              <div className="mt-4 p-3 bg-emerald-50 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-emerald-700">
                <FileText className="w-4 h-4" />
                {file.name}
              </div>
            )}

            <button
              onClick={handleSmartUpload}
              disabled={!file || processing}
              className="mt-8 w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-500 transition-all shadow-lg shadow-emerald-200 disabled:shadow-none"
            >
              {processing ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {processing ? "AI Analyzing & Placing..." : "Smart Import Now"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SmartUploadModal;

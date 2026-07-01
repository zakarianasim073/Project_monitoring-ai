import React, { useState, useEffect } from 'react';
import { UploadCloud, Loader2, Sparkles, CheckCircle2, X } from 'lucide-react';
import { api } from '../services/api';

const SmartUploadModal = ({ projectId, isOpen, onClose, onSuccess }: any) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setResult(null);
      setProcessing(false);

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 pr-8">
          <Sparkles className="text-emerald-600" /> Smart Document Import
        </h2>

        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-emerald-400 transition-colors">
          <input
            type="file"
            accept=".pdf,.xlsx,.xls,.docx"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="sr-only"
            id="smart-file"
          />
          <label htmlFor="smart-file" className="cursor-pointer block">
            <UploadCloud className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <p className="font-medium text-slate-900">Drop PDF, Excel or Word file</p>
            <p className="text-sm text-slate-500">AI will auto-detect and place data</p>
          </label>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium truncate max-w-[250px]">{file.name}</span>
          </div>
        )}

        <button 
          onClick={handleSmartUpload}
          disabled={!file || processing || result?.success}
          className={`mt-8 w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
            result?.success
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
          } disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none`}
        >
          {processing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : result?.success ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {processing
            ? "AI Analyzing & Placing..."
            : result?.success
              ? "Successfully Imported"
              : "Smart Import Now"}
        </button>

        {result && !result.success && (
          <p className="mt-4 text-center text-sm text-red-600 bg-red-50 p-3 rounded-xl">
            {result.message || "Import failed. Please try again."}
          </p>
        )}
      </div>
    </div>
  );
};

export default SmartUploadModal;

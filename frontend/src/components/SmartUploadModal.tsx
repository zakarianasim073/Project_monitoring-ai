import React, { useState, useEffect } from 'react';
import { UploadCloud, Loader2, Sparkles, X } from 'lucide-react';

interface SmartUploadModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SmartUploadModal: React.FC<SmartUploadModalProps> = ({ projectId, isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSmartUpload = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const filename = file.name;
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/projects/${projectId}/documents/smart-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ fileName: filename, fileType: file.type })
      });

      const data = await res.json();
      if (data.success) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Smart upload failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-upload-title"
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="smart-upload-title" className="text-2xl font-bold mb-6 flex items-center gap-3 pr-8 text-slate-800">
          <Sparkles className="text-emerald-600 w-6 h-6" /> Smart Document Import
        </h2>

        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-emerald-400 transition-colors group">
          <input
            type="file"
            accept=".pdf,.xlsx,.xls,.docx"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="smart-file"
          />
          <label htmlFor="smart-file" className="cursor-pointer block">
            <UploadCloud className="w-16 h-16 mx-auto text-slate-300 group-hover:text-emerald-500 mb-4 transition-colors" />
            <p className="font-medium text-slate-700">Drop PDF, Excel or Word file</p>
            <p className="text-sm text-slate-500 mt-1">AI will auto-detect and place data</p>
          </label>
        </div>

        {file && (
          <div className="mt-4 p-3 bg-emerald-50 rounded-xl flex items-center justify-center gap-2 border border-emerald-100">
            <p className="text-sm font-medium text-emerald-700 truncate">{file.name}</p>
          </div>
        )}

        <button 
          onClick={handleSmartUpload}
          disabled={!file || processing}
          className="mt-8 w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg shadow-emerald-100 disabled:shadow-none"
        >
          {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          <span>{processing ? "AI Analyzing & Placing..." : "Smart Import Now"}</span>
        </button>
      </div>
    </div>
  );
};

export default SmartUploadModal;

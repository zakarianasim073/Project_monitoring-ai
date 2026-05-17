import React, { useState, useEffect, useCallback } from 'react';
import { UploadCloud, Loader2, Sparkles, X } from 'lucide-react';

const SmartUploadModal = ({ projectId, isOpen, onClose, onSuccess }: any) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

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
      setResult(data);

      if (data.success || res.ok) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Smart upload failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !processing) {
      onClose();
    }
  }, [onClose, processing]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 transition-opacity"
      onClick={() => !processing && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          onClick={onClose}
          disabled={processing}
          className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all disabled:opacity-0"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 id="modal-title" className="text-2xl font-bold mb-6 flex items-center gap-3 pr-8">
          <Sparkles className="text-emerald-600" /> Smart Document Import
        </h2>

        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center hover:border-emerald-400 transition-colors group">
          <input
            type="file"
            accept=".pdf,.xlsx,.xls,.docx"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="smart-file"
            disabled={processing}
          />
          <label
            htmlFor="smart-file"
            className={`cursor-pointer block ${processing ? 'pointer-events-none' : ''}`}
          >
            <UploadCloud className="w-16 h-16 mx-auto text-slate-300 mb-4 group-hover:text-emerald-500 transition-colors" />
            <p className="font-semibold text-slate-700">Drop PDF, Excel or Word</p>
            <p className="text-sm text-slate-400 mt-1">AI will auto-detect and place data</p>
          </label>
        </div>

        {file && !result && (
          <p className="mt-4 text-sm text-center font-medium text-emerald-600 animate-in fade-in slide-in-from-top-2">
            Selected: {file.name}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleSmartUpload}
            disabled={!file || processing}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-emerald-200 disabled:shadow-none"
          >
            {processing ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            {processing ? "AI Analyzing & Placing..." : "Smart Import Now"}
          </button>

          {!processing && (
            <button
              onClick={onClose}
              className="w-full py-4 text-slate-500 font-semibold hover:bg-slate-50 rounded-2xl transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartUploadModal;

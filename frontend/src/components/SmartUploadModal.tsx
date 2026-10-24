import React, { useState } from 'react';
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
  const [result, setResult] = useState<any>(null);

  const handleSmartUpload = async () => {
    if (!file) return;
    setProcessing(true);

    try {
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

      if (data.success) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 pr-8">
          <Sparkles className="text-emerald-600 shrink-0" />
          <span className="truncate">Smart Document Import</span>
        </h2>

        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center hover:border-emerald-400 transition-colors group">
          <input
            type="file"
            accept=".pdf,.xlsx,.xls,.docx"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="smart-file"
          />
          <label htmlFor="smart-file" className="cursor-pointer block">
            <div className="bg-slate-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-50 transition-colors">
              <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <p className="font-semibold text-slate-700">Drop PDF, Excel or Word file</p>
            <p className="text-sm text-slate-500 mt-1">AI will auto-detect and place data</p>
          </label>
        </div>

        {file && (
          <div className="mt-4 p-3 bg-emerald-50 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-200 rounded-lg flex items-center justify-center text-emerald-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-emerald-700 truncate flex-1">{file.name}</p>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSmartUpload}
            disabled={!file || processing}
            className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:shadow-none"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {processing ? "AI Analyzing..." : "Smart Import Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartUploadModal;

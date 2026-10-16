import React, { useState, useEffect } from 'react';
import { UploadCloud, Loader2, Sparkles, X } from 'lucide-react';

const SmartUploadModal = ({ projectId, isOpen, onClose, onSuccess }: any) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSmartUpload = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/projects/${projectId}/documents/smart-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ fileName: file.name, fileType: file.type })
      });
      const data = await res.json();
      if (data.success) { onSuccess(); onClose(); }
    } catch (err) { console.error(err); } finally { setProcessing(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-6 top-6 p-2 text-slate-400 hover:bg-slate-100 rounded-xl" aria-label="Close modal">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Sparkles className="text-emerald-600" /> Smart Import</h2>
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-emerald-400 transition-all focus-within:ring-2 focus-within:ring-emerald-500">
          <input type="file" accept=".pdf,.xlsx,.xls,.docx" onChange={e => setFile(e.target.files?.[0] || null)} className="sr-only" id="smart-file" />
          <label htmlFor="smart-file" className="cursor-pointer block outline-none">
            <UploadCloud className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <p className="font-medium">Drop PDF, Excel or Word file</p>
          </label>
        </div>
        {file && <p className="mt-4 text-sm text-center text-emerald-600 font-medium">{file.name}</p>}
        <button onClick={handleSmartUpload} disabled={!file || processing} className="mt-8 w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-300">
          {processing ? <Loader2 className="animate-spin" /> : <Sparkles />}{processing ? "AI Analyzing..." : "Smart Import Now"}
        </button>
      </div>
    </div>
  );
};

export default SmartUploadModal;

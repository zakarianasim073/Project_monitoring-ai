import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Loader2, Sparkles, CheckCircle2, X } from 'lucide-react';

const SmartUploadModal = ({ projectId, isOpen, onClose, onSuccess }: any) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setResult(null);
      setProcessing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && isOpen) {
        const focusable = Array.from(document.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])'));
        const modalElements = focusable.filter(el => closeBtnRef.current?.parentElement?.contains(el));
        const first = modalElements[0] as HTMLElement;
        const last = modalElements[modalElements.length - 1] as HTMLElement;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md p-8 relative transition-all"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          ref={closeBtnRef}
          onClick={onClose}
          className="absolute right-6 top-6 p-2 hover:bg-slate-100 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        <h2 id="modal-title" className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Sparkles className="text-emerald-600" /> Smart Document Import
        </h2>

        {result?.success ? (
          <div className="py-10 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Import Successful!</h3>
            <p className="text-slate-500 mb-8">AI has processed your document and updated the project.</p>
            <button
              onClick={onClose}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-emerald-400 transition-colors group focus-within:border-emerald-500">
          <input type="file" accept=".pdf,.xlsx,.xls,.docx" onChange={e => setFile(e.target.files?.[0] || null)} className="sr-only" id="smart-file" />
          <label htmlFor="smart-file" className="cursor-pointer block outline-none">
            <UploadCloud className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <p className="font-medium">Drop PDF, Excel or Word file</p>
            <p className="text-sm text-slate-500">AI will auto-detect and place data</p>
          </label>
        </div>

        {file && <p className="mt-4 text-sm text-center text-emerald-600">{file.name}</p>}

            <button
              onClick={handleSmartUpload}
              disabled={!file || processing}
              className="mt-8 w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-300 transition-all hover:shadow-lg active:scale-[0.98]"
            >
              {processing ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              {processing ? "AI Analyzing & Placing..." : "Smart Import Now"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SmartUploadModal;

import React, { useState } from 'react';
import { ProjectDocument } from '../types';
import { FileText, Image, File, Search, UploadCloud, Download, X, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import SmartUploadModal from './SmartUploadModal';

interface DocumentManagerProps {
  projectId: string;
  documents: ProjectDocument[];
  onAddDocument: (doc: ProjectDocument) => void;
  filterModule?: string;
  compact?: boolean;
  allowUpload?: boolean;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ 
  projectId,
  documents, 
  onAddDocument, 
  filterModule,
  compact = false,
  allowUpload = true 
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showSmartUpload, setShowSmartUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const filteredDocs = filterModule
    ? documents.filter(doc => doc.module === filterModule)
    : documents;

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    // In real app you would upload file to backend first, then call onAddDocument
    const newDoc: ProjectDocument = {
      id: `D${Date.now()}`,
      name: selectedFile.name,
      type: 'PDF',
      category: 'REPORT',
      module: (filterModule as any) || 'GENERAL',
      uploadDate: new Date().toISOString().split('T')[0],
      size: `${(selectedFile.size / (1024*1024)).toFixed(1)} MB`,
      isAnalyzed: false
    };
    onAddDocument(newDoc);
    setUploading(false);
    setIsUploadModalOpen(false);
    setSelectedFile(null);
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden ${compact ? '' : 'h-full'}`}>
      <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
        <h3 className="font-semibold text-xl text-slate-800">Documents</h3>
        {allowUpload && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowSmartUpload(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-sm font-medium transition-all"
            >
              <Sparkles className="w-4 h-4" /> Smart Import
            </button>
            <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-medium transition-all">
              <UploadCloud className="w-4 h-4" /> Upload
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold text-xs">File Name</th>
              {!compact && <th className="px-6 py-4 font-semibold text-xs">Upload Date</th>}
              <th className="px-6 py-4 font-semibold text-xs text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                  No documents found
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.size}</p>
                      </div>
                    </div>
                  </td>
                  {!compact && <td className="px-6 py-4 text-sm text-slate-500">{doc.uploadDate}</td>}
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-all" aria-label="Download document">
                      <Download className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showSmartUpload && (
        <SmartUploadModal
          projectId={projectId}
          isOpen={showSmartUpload}
          onClose={() => setShowSmartUpload(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsUploadModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsUploadModalOpen(false)} className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold mb-6">Upload Document</h3>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
              <input type="file" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <UploadCloud className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="font-medium text-slate-700">Choose a file to upload</p>
              </label>
            </div>
            {selectedFile && <p className="mt-4 text-sm text-center text-blue-600 font-medium">{selectedFile.name}</p>}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="mt-8 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold transition-all disabled:bg-slate-200 disabled:text-slate-400"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Upload Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;

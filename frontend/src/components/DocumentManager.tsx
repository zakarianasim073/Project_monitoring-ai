import React, { useState } from 'react';
import { ProjectDocument } from '../types';
import { FileText, Download, UploadCloud, X, Sparkles } from 'lucide-react';
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

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
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
      <div className="p-6 border-b flex justify-between items-center">
        <h3 className="font-semibold text-xl">Documents</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSmartUpload(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Smart Import
          </button>
          {allowUpload && (
            <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-sm hover:bg-blue-700 transition-colors">
              <UploadCloud className="w-4 h-4" /> Upload
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Type</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.filter(d => !filterModule || d.module === filterModule).map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-slate-700">{doc.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">{doc.type}</td>
                <td className="px-6 py-4 text-slate-500 text-sm">{doc.uploadDate}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-blue-600 p-2 rounded-lg transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {documents.filter(d => !filterModule || d.module === filterModule).length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                  No documents found
                </td>
              </tr>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsUploadModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-8 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsUploadModalOpen(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold mb-6">Upload Document</h3>
            <div className="border-2 border-dashed rounded-2xl p-10 text-center mb-6">
              <input type="file" id="file-upload" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              <label htmlFor="file-upload" className="cursor-pointer">
                <UploadCloud className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                <p className="font-medium text-slate-600">{selectedFile ? selectedFile.name : 'Click to select file'}</p>
              </label>
            </div>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold disabled:bg-slate-300"
            >
              {uploading ? 'Uploading...' : 'Confirm Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;

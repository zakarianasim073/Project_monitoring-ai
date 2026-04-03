import React, { useState } from 'react';
import { ProjectDocument } from '../types';
import { FileText, Image, File, Search, UploadCloud, Download, X, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import SmartUploadModal from './SmartUploadModal';

interface DocumentManagerProps {
  documents: ProjectDocument[];
  onAddDocument: (doc: ProjectDocument) => void;
  filterModule?: string;
  compact?: boolean;
  allowUpload?: boolean;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ 
  documents, 
  onAddDocument, 
  filterModule,
  compact = false,
  allowUpload = true 
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showSmartUpload, setShowSmartUpload] = useState(false);
  const projectId = localStorage.getItem('currentProjectId');

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
      <div className="p-6 border-b flex justify-between items-center">
        <h3 className="font-semibold text-xl">Documents</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSmartUpload(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" /> Smart Import (PDF/Excel/Word)
          </button>
          {allowUpload && (
            <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-sm font-medium">
              <UploadCloud className="w-4 h-4" /> Upload
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="text-center text-slate-500 py-10">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Document library and versioning</p>
        </div>
      </div>

      {showSmartUpload && (
        <SmartUploadModal
          projectId={projectId!}
          isOpen={showSmartUpload}
          onClose={() => setShowSmartUpload(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Upload Document</h2>
            <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="mb-6" />
            <div className="flex gap-4">
              <button onClick={() => setIsUploadModalOpen(false)} className="flex-1 py-3 border rounded-2xl">Cancel</button>
              <button onClick={handleUpload} disabled={!selectedFile || uploading} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;

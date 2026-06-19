import React, { useState } from 'react';
import { ProjectDocument } from '../types';
import { FileText, UploadCloud, X, Sparkles, Loader2 } from 'lucide-react';
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
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
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
        <div className="flex gap-2">
          {allowUpload && (
            <>
              <button
                onClick={() => setShowSmartUpload(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" /> Smart Import
              </button>
              <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-sm font-medium">
                <UploadCloud className="w-4 h-4" /> Upload
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        {documents.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p>No documents found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{doc.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
            <button onClick={() => setIsUploadModalOpen(false)} className="absolute right-6 top-6 p-2 hover:bg-slate-100 rounded-full" aria-label="Close upload modal">
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <h3 className="text-xl font-bold mb-6">Upload Document</h3>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
              <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Click to select file</p>
              </label>
            </div>
            {selectedFile && <p className="mt-4 text-sm text-center text-blue-600 font-medium">{selectedFile.name}</p>}
            <button
              disabled={!selectedFile || uploading}
              onClick={handleUpload}
              className="w-full mt-6 bg-blue-600 text-white py-4 rounded-2xl font-bold disabled:bg-slate-300"
            >
              {uploading ? "Uploading..." : "Upload Now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;

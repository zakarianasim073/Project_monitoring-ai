import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ProjectDocument, UserRole } from '../types';
import { UploadCloud, Sparkles } from 'lucide-react';
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
  const { projectId } = useOutletContext<{ currentRole: UserRole; projectId: string }>();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showSmartUpload, setShowSmartUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [_uploading, setUploading] = useState(false);

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
        <div className="flex gap-2">
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

      <div className="p-6">
        {documents.length === 0 ? (
          <div className="text-center py-10 text-slate-500">No documents found.</div>
        ) : (
          <div className="space-y-4">
            {documents.filter(doc => !filterModule || doc.module === filterModule).map(doc => (
              <div key={doc.id} className="flex justify-between items-center p-4 border rounded-2xl">
                <div>
                  <div className="font-medium">{doc.name}</div>
                  <div className="text-xs text-slate-500">{doc.size} • {doc.uploadDate}</div>
                </div>
                <div className="text-xs px-2 py-1 bg-slate-100 rounded-lg">{doc.type}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSmartUpload && (
        <SmartUploadModal
          projectId={projectId!}
          isOpen={showSmartUpload}
          onClose={() => setShowSmartUpload(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Simple Upload Modal for demonstration */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Upload Document</h2>
            <input
              type="file"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="mb-6 w-full"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 rounded-2xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold disabled:bg-slate-300"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;

import React, { useState } from 'react';
import { ProjectDocument } from '../types';
import { FileText, Image, File, Search, UploadCloud, Download, X, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api';

// Inside DocumentManager component
<button 
  onClick={() => setShowSmartUpload(true)}
  className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-sm font-medium"
>
  <Sparkles className="w-4 h-4" /> Smart Import (PDF/Excel/Word)
</button>

// Add this modal
{showSmartUpload && (
  <SmartUploadModal 
    projectId={projectId!}
    isOpen={showSmartUpload}
    onClose={() => setShowSmartUpload(false)}
    onSuccess={() => window.location.reload()}
  />
)}

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
      <div className="p-6 border-b flex justify-between">
        <h3 className="font-semibold text-xl">Documents</h3>
        {allowUpload && (
          <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-sm">
            <UploadCloud className="w-4 h-4" /> Upload
          </button>
        )}
      </div>

      {/* Your original table with AI Deep Scan buttons */}

      {/* Upload Modal - keep your beautiful modal */}
    </div>
  );
};

export default DocumentManager;

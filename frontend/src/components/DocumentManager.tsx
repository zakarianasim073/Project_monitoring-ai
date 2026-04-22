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
  projectId?: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ 
  documents, 
  onAddDocument, 
  filterModule,
  compact = false,
  allowUpload = true,
  projectId
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showSmartUpload, setShowSmartUpload] = useState(false);
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
              <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-sm">
                <UploadCloud className="w-4 h-4" /> Upload
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        {documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-sm border-b">
                  <th className="pb-4 font-medium">Document Name</th>
                  <th className="pb-4 font-medium">Category</th>
                  <th className="pb-4 font-medium">Date</th>
                  <th className="pb-4 font-medium">Size</th>
                  <th className="pb-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-slate-50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{doc.name}</p>
                          <p className="text-xs text-slate-500 uppercase">{doc.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-slate-600">{doc.category}</td>
                    <td className="py-4 text-sm text-slate-600">{doc.uploadDate}</td>
                    <td className="py-4 text-sm text-slate-600">{doc.size}</td>
                    <td className="py-4">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" aria-label="Download document">
                        <Download className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No documents found</p>
          </div>
        )}
      </div>

      {showSmartUpload && projectId && (
        <SmartUploadModal
          projectId={projectId}
          isOpen={showSmartUpload}
          onClose={() => setShowSmartUpload(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
};

export default DocumentManager;

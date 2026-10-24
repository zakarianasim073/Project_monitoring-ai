import React, { useState } from 'react';
import { ProjectDocument } from '../types';
import { FileText, Image, File, Search, UploadCloud, Download, X, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useOutletContext } from 'react-router-dom';
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
  const [showSmartUpload, setShowSmartUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { projectId } = useOutletContext<{ projectId: string }>();

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
        <div className="flex items-center gap-3">
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
        {documents.length === 0 ? (
          <div className="text-center py-10 text-slate-500">No documents found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-sm uppercase tracking-wider">
                  <th className="pb-4 font-medium">Name</th>
                  <th className="pb-4 font-medium">Module</th>
                  <th className="pb-4 font-medium">Date</th>
                  <th className="pb-4 font-medium">Size</th>
                  <th className="pb-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map(doc => (
                  <tr key={doc.id} className="group">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-slate-700">{doc.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-slate-600">{doc.module}</td>
                    <td className="py-4 text-slate-500">{doc.uploadDate}</td>
                    <td className="py-4 text-slate-500">{doc.size}</td>
                    <td className="py-4 text-right">
                      <button
                        aria-label={`Download ${doc.name}`}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Upload Document</h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
                aria-label="Close upload modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="border-2 border-dashed rounded-2xl p-10 text-center mb-6">
              <input type="file" id="file-upload" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <UploadCloud className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                <p className="text-slate-600">Click to select file</p>
              </label>
            </div>
            {selectedFile && <p className="mb-6 text-sm text-blue-600 text-center font-medium">{selectedFile.name}</p>}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Confirm Upload'}
            </button>
          </div>
        </div>
      )}

      {showSmartUpload && (
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

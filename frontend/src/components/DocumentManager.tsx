import React, { useState } from 'react';
import { ProjectDocument } from '../types';
import { FileText, Image, File, Search, UploadCloud, Download, X, Sparkles, Loader2 } from 'lucide-react';
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
      type: selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE',
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

  const filteredDocs = filterModule
    ? documents.filter(doc => doc.module === filterModule)
    : documents;

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col ${compact ? '' : 'h-full'}`}>
      <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-bold text-xl text-slate-800">Documents</h3>
          <p className="text-sm text-slate-500">{filteredDocs.length} items total</p>
        </div>
        <div className="flex gap-2">
          {projectId && (
            <button
              onClick={() => setShowSmartUpload(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
            >
              <Sparkles className="w-4 h-4" /> Smart Import
            </button>
          )}
          {allowUpload && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <UploadCloud className="w-4 h-4" /> Upload
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No documents found</p>
            <p className="text-sm text-slate-400">Upload documents to get started</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Size</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        {doc.type === 'PDF' ? <FileText className="w-4 h-4" /> : <File className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-slate-700">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{doc.uploadDate}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{doc.size}</td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 relative">
            <button onClick={() => setIsUploadModalOpen(false)} className="absolute right-6 top-6 p-2 hover:bg-slate-100 rounded-full">
              <X className="w-5 h-5 text-slate-400" />
            </button>
            <h3 className="text-2xl font-bold mb-6">Upload Document</h3>
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center mb-6">
              <input type="file" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <UploadCloud className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">{selectedFile ? selectedFile.name : 'Click to select file'}</p>
              </label>
            </div>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-slate-300"
            >
              {uploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
              {uploading ? 'Uploading...' : 'Upload Now'}
            </button>
          </div>
        </div>
      )}

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

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ProjectDocument } from '../types';
import { FileText, UploadCloud, Sparkles } from 'lucide-react';
import SmartUploadModal from './SmartUploadModal';

interface DocumentManagerProps {
  documents: ProjectDocument[];
  onAddDocument: (doc: ProjectDocument) => void;
  filterModule?: string;
  compact?: boolean;
  allowUpload?: boolean;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ 
  documents, onAddDocument, filterModule, compact = false, allowUpload = true
}) => {
  const { projectId } = useParams();
  const [showSmartUpload, setShowSmartUpload] = useState(false);

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden ${compact ? '' : 'h-full'}`}>
      <div className="p-6 border-b flex justify-between items-center">
        <h3 className="font-semibold text-xl">Documents</h3>
        <div className="flex gap-2">
          {allowUpload && (
            <>
              <button onClick={() => setShowSmartUpload(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-sm font-medium">
                <Sparkles className="w-4 h-4" /> Smart Import
              </button>
              <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-sm">
                <UploadCloud className="w-4 h-4" /> Upload
              </button>
            </>
          )}
        </div>
      </div>
      <div className="p-8 text-center text-slate-500">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p>{documents.length > 0 ? `${documents.length} documents found` : `No documents found in ${filterModule || 'General'}`}</p>
      </div>
      {showSmartUpload && <SmartUploadModal projectId={projectId!} isOpen={showSmartUpload} onClose={() => setShowSmartUpload(false)} onSuccess={() => {}} />}
    </div>
  );
};

export default DocumentManager;

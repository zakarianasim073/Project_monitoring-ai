import mongoose from 'mongoose';

const ProjectDocumentSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['CONTRACT', 'DRAWING', 'PERMIT', 'REPORT', 'BILL', 'OTHER'], 
    required: true 
  },
  module: { 
    type: String, 
    enum: ['GENERAL', 'SITE', 'FINANCE', 'MASTER', 'LIABILITY'], 
    required: true 
  },
  uploadDate: { type: String, required: true },
  size: String,
  url: String,
  isAnalyzed: { type: Boolean, default: false }
}, { timestamps: true });

export const ProjectDocument = mongoose.model('ProjectDocument', ProjectDocumentSchema);

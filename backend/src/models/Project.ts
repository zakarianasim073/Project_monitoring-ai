import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contractValue: { type: Number, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED'], default: 'ACTIVE' },
  priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },

  boq: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BOQItem' }],
  dprs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DPR' }],
  materials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Material' }],
  subContractors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubContractor' }],
  bills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bill' }],
  liabilities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Liability' }],
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectDocument' }],

  milestones: [{
    title: String,
    date: String,
    status: { type: String, enum: ['COMPLETED', 'AT_RISK', 'PENDING'] },
    description: String
  }],

  aiSuggestions: [{
    id: String,
    type: String,
    title: String,
    description: String,
    status: { type: String, enum: ['PENDING', 'APPLIED', 'DISMISSED'] }
  }]
}, { timestamps: true });

export const Project = mongoose.model('Project', ProjectSchema);

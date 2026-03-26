import mongoose from 'mongoose';

const DPRSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  date: { type: String, required: true },
  activity: { type: String, required: true },
  location: { type: String, default: 'Site' },
  laborCount: { type: Number, default: 0 },
  remarks: String,
  linkedBoqId: String,
  subContractorId: String,
  workDoneQty: Number,
  materialsUsed: [{
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
    qty: Number
  }]
}, { timestamps: true });

export const DPR = mongoose.model('DPR', DPRSchema);

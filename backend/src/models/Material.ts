import mongoose from 'mongoose';

const MaterialSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  unit: { type: String, required: true },
  totalReceived: { type: Number, default: 0 },
  totalConsumed: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  averageRate: { type: Number, default: 0 },
  pdRemarks: String
}, { timestamps: true });

export const Material = mongoose.model('Material', MaterialSchema);

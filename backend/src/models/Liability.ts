import mongoose from 'mongoose';

const LiabilitySchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['RETENTION', 'PENDING_PO', 'UNBILLED_WORK'], 
    required: true 
  },
  amount: { type: Number, required: true },
  dueDate: { type: String, required: true }
}, { timestamps: true });

export const Liability = mongoose.model('Liability', LiabilitySchema);

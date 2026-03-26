import mongoose from 'mongoose';

const BillSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  type: { 
    type: String, 
    enum: ['CLIENT_RA', 'VENDOR_INVOICE', 'MATERIAL_EXPENSE', 'SUB_CONTRACTOR'], 
    required: true 
  },
  entityName: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
  pdRemarks: String
}, { timestamps: true });

export const Bill = mongoose.model('Bill', BillSchema);

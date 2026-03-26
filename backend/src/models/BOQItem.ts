import mongoose from 'mongoose';

const BOQItemSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  id: { type: String, required: true }, // e.g. "BOQ-001"
  description: { type: String, required: true },
  plannedQty: { type: Number, required: true },
  executedQty: { type: Number, default: 0 },
  unit: { type: String, required: true },
  rate: { type: Number, required: true },
  priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
  billedAmount: { type: Number, default: 0 },

  costAnalysis: {
  unitCost: Number,                    // Total actual unit cost
  breakdown: {
    material: { type: Number, default: 0 },
    labor: { type: Number, default: 0 },
    equipment: { type: Number, default: 0 },
    overhead: { type: Number, default: 0 }
  },
  govtDeductionRate: { type: Number, default: 14.5 },   // 14.5% on quoted rate
  govtDeductionAmount: Number,
  profitPerUnit: Number,
  totalProfitLoss: Number
  }
}, { timestamps: true });

export const BOQItem = mongoose.model('BOQItem', BOQItemSchema);

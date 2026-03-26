import mongoose from 'mongoose';

const SubContractorSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  specialization: String,
  totalWorkValue: { type: Number, default: 0 },
  totalBilled: { type: Number, default: 0 },
  currentLiability: { type: Number, default: 0 },
  pdRemarks: String,
  agreedRates: [{
    boqId: String,
    rate: Number
  }]
}, { timestamps: true });

export const SubContractor = mongoose.model('SubContractor', SubContractorSchema);

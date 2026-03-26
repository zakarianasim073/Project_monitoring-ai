import mongoose from 'mongoose';

const ProjectMemberSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { 
    type: String, 
    enum: ['DIRECTOR', 'MANAGER', 'ENGINEER', 'ACCOUNTANT'], 
    required: true 
  }
}, { timestamps: true });

export const ProjectMember = mongoose.model('ProjectMember', ProjectMemberSchema);

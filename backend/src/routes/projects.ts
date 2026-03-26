import express from 'express';
import { protect, requireProjectRole } from '../middleware/auth';
import { Project } from '../models/Project';
import { ProjectMember } from '../models/ProjectMember';
import dprController from '../controllers/dprController';
import billController from '../controllers/billController';
// ... other controllers

const router = express.Router();

router.get('/my-projects', protect, async (req, res) => {
  const members = await ProjectMember.find({ user: req.user._id }).populate('project');
  res.json(members.map(m => ({
    ...m.project.toObject(),
    myRole: m.role
  })));
});

router.get('/:projectId', protect, requireProjectRole(['DIRECTOR', 'MANAGER', 'ENGINEER', 'ACCOUNTANT']), async (req, res) => {
  const project = await Project.findById(req.params.projectId)
    .populate('boq dprs materials subContractors bills liabilities documents');
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// DPR Routes
router.post('/:projectId/dprs', protect, requireProjectRole(['ENGINEER', 'DIRECTOR']), dprController.createDPR);

// Bill Routes
router.post('/:projectId/bills', protect, requireProjectRole(['MANAGER', 'ACCOUNTANT', 'DIRECTOR']), billController.createBill);

// Add more routes for materials, documents, remarks, etc.

export default router;

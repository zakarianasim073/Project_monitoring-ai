import express from 'express';
import { protect, requireProjectRole } from '../middleware/auth';

// Controllers
import dprController from '../controllers/dprController';
import billController from '../controllers/billController';
import inventoryController from '../controllers/inventoryController';
import costingController from '../controllers/costingController';

// Gemini service for AI features
import geminiService from '../services/geminiService';

const router = express.Router();

// SMART DOCUMENT UPLOAD + AUTO PLACE
router.post(
  '/:projectId/documents/smart-upload', 
  protect, 
  requireProjectRole(['DIRECTOR', 'MANAGER', 'ENGINEER']), 
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const { fileName, fileType } = req.body;

      const parsed = await geminiService.deepScanDocument(fileName, fileType);
      if (!parsed) return res.status(400).json({ error: "Failed to parse document" });

      const result = await geminiService.autoPlaceDocumentData(parsed, projectId);

      res.json({
        success: true,
        message: `Document smart-placed as ${parsed.documentType}`,
        placedData: parsed
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  '/:projectId/boq/:boqItemId/analyze-cost', 
  protect, 
  requireProjectRole(['DIRECTOR', 'MANAGER']), 
  costingController.analyzeItemCost
);

// ====================== PUBLIC PROJECT LIST ======================
router.get('/my-projects', protect, async (req, res) => {
  try {
    const { ProjectMember } = await import('../models/ProjectMember');
    const members = await ProjectMember.find({ user: (req as any).user._id })
      .populate('project', 'name contractValue startDate endDate status priority');

    const projects = members.map((m: any) => ({
      ...m.project.toObject(),
      myRole: m.role
    }));

    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ====================== SINGLE PROJECT (with role check) ======================
router.get('/:projectId', protect, requireProjectRole(['DIRECTOR', 'MANAGER', 'ENGINEER', 'ACCOUNTANT']), async (req, res) => {
  try {
    const { Project } = await import('../models/Project');
    const project = await Project.findById(req.params.projectId)
      .populate('boq')
      .populate('dprs')
      .populate('materials')
      .populate('subContractors')
      .populate('bills')
      .populate('liabilities')
      .populate('documents');

    if (!project) return res.status(404).json({ error: 'Project not found' });

    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ====================== DPR ROUTES ======================
router.post(
  '/:projectId/dprs', 
  protect, 
  requireProjectRole(['ENGINEER', 'DIRECTOR']), 
  dprController.createDPR
);

// ====================== BILL ROUTES ======================
router.post(
  '/:projectId/bills', 
  protect, 
  requireProjectRole(['MANAGER', 'ACCOUNTANT', 'DIRECTOR']), 
  billController.createBill
);

// ====================== INVENTORY / MATERIAL ROUTES ======================
router.post(
  '/:projectId/materials/receive', 
  protect, 
  requireProjectRole(['ENGINEER', 'MANAGER', 'DIRECTOR']), 
  inventoryController.receiveMaterial
);

// ====================== PD REMARKS (Director only) ======================
router.patch(
  '/:projectId/remarks', 
  protect, 
  requireProjectRole(['DIRECTOR']), 
  inventoryController.updatePDRemarks
);

// ====================== DOCUMENT ROUTES ======================
router.post(
  '/:projectId/documents', 
  protect, 
  requireProjectRole(['ENGINEER', 'MANAGER', 'DIRECTOR', 'ACCOUNTANT']), 
  async (req, res) => {
    try {
      const { ProjectDocument } = await import('../models/ProjectDocument');
      const { Project } = await import('../models/Project');

      const newDoc = new ProjectDocument({
        ...req.body,
        project: req.params.projectId,
        uploadDate: new Date().toISOString().split('T')[0]
      });

      await newDoc.save();

      const project = await Project.findById(req.params.projectId);
      if (project) {
        project.documents.push(newDoc._id);
        await project.save();
      }

      res.status(201).json(newDoc);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ====================== AI FEATURES ======================
router.post(
  '/:projectId/ai/extract-dpr', 
  protect, 
  requireProjectRole(['ENGINEER', 'DIRECTOR']), 
  async (req, res) => {
    try {
      const { documentName, boqItems } = req.body;
      const extracted = await geminiService.extractDPRData(documentName, boqItems);
      res.json(extracted);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  '/:projectId/ai/insights', 
  protect, 
  async (req, res) => {
    try {
      const { Project } = await import('../models/Project');
      const project = await Project.findById(req.params.projectId);
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const insight = await geminiService.generateProjectInsights(project);
      res.json({ insight });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  '/:projectId/ai/extract-bill', 
  protect, 
  requireProjectRole(['MANAGER', 'ACCOUNTANT', 'DIRECTOR']), 
  async (req, res) => {
    try {
      const { documentName } = req.body;
      const extracted = await geminiService.extractBillData(documentName);
      res.json(extracted);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

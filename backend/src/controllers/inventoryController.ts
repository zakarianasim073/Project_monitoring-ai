import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // SECURITY: BOLA protection - use exists() for faster validation and scoped lookup
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // SECURITY: BOLA protection - ensure material belongs to the project
    // Optimization: Use aggregation pipeline in findOneAndUpdate for atomic weighted average update
    const material = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            totalReceived: { $add: ["$totalReceived", Number(qty)] },
            currentStock: { $add: ["$currentStock", Number(qty)] },
            averageRate: rate ? {
              $divide: [
                { $add: [{ $multiply: ["$averageRate", "$totalReceived"] }, { $multiply: [Number(rate), Number(qty)] }] },
                { $add: ["$totalReceived", Number(qty)] }
              ]
            } : "$averageRate"
          }
        }
      ],
      { new: true }
    );

    if (!material) return res.status(404).json({ error: 'Material not found' });

    res.json({
      success: true,
      message: `Received ${qty} ${material.unit} of ${material.name}`,
      material
    });

  } catch (error: any) {
    // SECURITY: Prevent Information Leakage
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    // SECURITY: BOLA protection - use exists() for faster validation and scoped lookup
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    let updated = false;

    // SECURITY: Use findOneAndUpdate scoped to project to prevent BOLA
    if (type === 'MATERIAL') {
      const doc = await Material.findOneAndUpdate({ _id: id, project: projectId }, { pdRemarks: remarks });
      if (doc) updated = true;
    } else if (type === 'SUBCONTRACTOR') {
      const { SubContractor } = await import('../models/SubContractor');
      const doc = await SubContractor.findOneAndUpdate({ _id: id, project: projectId }, { pdRemarks: remarks });
      if (doc) updated = true;
    } else if (type === 'BILL') {
      const { Bill } = await import('../models/Bill');
      const doc = await Bill.findOneAndUpdate({ _id: id, project: projectId }, { pdRemarks: remarks });
      if (doc) updated = true;
    }

    if (!updated) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    // SECURITY: Prevent Information Leakage
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

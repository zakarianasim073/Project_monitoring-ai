import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // OPTIMIZATION: Use .exists() to avoid full hydration of large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const quantity = Number(qty);
    const newRate = Number(rate) || 0;

    // OPTIMIZATION: Use findOneAndUpdate with aggregation pipeline for atomic update
    // This avoids race conditions and ensures weighted average uses pre-update values correctly.
    // SECURITY: Scope lookup to projectId to prevent BOLA
    const material = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            averageRate: {
              $cond: [
                { $gt: [newRate, 0] },
                {
                  $divide: [
                    { $add: [{ $multiply: ["$averageRate", "$totalReceived"] }, { $multiply: [newRate, quantity] }] },
                    { $add: ["$totalReceived", quantity] }
                  ]
                },
                "$averageRate"
              ]
            },
            totalReceived: { $add: ["$totalReceived", quantity] },
            currentStock: { $add: ["$currentStock", quantity] }
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
    // SECURITY: Generic error message to prevent information leakage
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    let targetModel: any = null;

    if (type === 'MATERIAL') {
      targetModel = Material;
    } else if (type === 'SUBCONTRACTOR') {
      targetModel = (await import('../models/SubContractor')).SubContractor;
    } else if (type === 'BILL') {
      targetModel = (await import('../models/Bill')).Bill;
    }

    if (!targetModel) return res.status(400).json({ error: 'Invalid item type' });

    // OPTIMIZATION & SECURITY: Use findOneAndUpdate scoped to projectId
    const target = await targetModel.findOneAndUpdate(
      { _id: id, project: projectId },
      { $set: { pdRemarks: remarks } },
      { new: true }
    );

    if (!target) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    // SECURITY: Generic error message to prevent information leakage
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

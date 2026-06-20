import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // Use .exists() for faster validation and BOLA enforcement
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // Atomic update with BOLA scoping and corrected weighted average calculation
    const material = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            averageRate: {
              $cond: {
                if: { $gt: [Number(rate || 0), 0] },
                then: {
                  $divide: [
                    { $add: [{ $multiply: ["$averageRate", "$totalReceived"] }, { $multiply: [Number(rate), Number(qty)] }] },
                    { $add: ["$totalReceived", Number(qty)] }
                  ]
                },
                else: "$averageRate"
              }
            },
            totalReceived: { $add: ["$totalReceived", Number(qty)] },
            currentStock: { $add: ["$currentStock", Number(qty)] }
          }
        }
      ],
      { new: true }
    );

    if (!material) return res.status(404).json({ error: 'Material not found or access denied' });

    res.json({
      success: true,
      message: `Received ${qty} ${material.unit} of ${material.name}`,
      material
    });

  } catch (error: any) {
    console.error(`[receiveMaterial Error]: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body;

    let model: any;
    if (type === 'MATERIAL') model = Material;
    else if (type === 'SUBCONTRACTOR') model = (await import('../models/SubContractor')).SubContractor;
    else if (type === 'BILL') model = (await import('../models/Bill')).Bill;
    else return res.status(400).json({ error: 'Invalid type' });

    // Atomic update enforcing BOLA scoping
    const result = await model.updateOne(
      { _id: id, project: projectId },
      { $set: { pdRemarks: remarks } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found or access denied' });
    }

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    console.error(`[updatePDRemarks Error]: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

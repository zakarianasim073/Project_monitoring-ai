import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // Use .exists() for faster validation without hydrating large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // OPTIMIZATION: Use atomic findOneAndUpdate with aggregation pipeline to update stock and
    // calculate weighted average in one step, avoiding read-modify-write and N+1 overhead.
    // Also fixes logic bug where oldTotalValue was calculated using already-incremented totalReceived.
    // Scoped to projectId for BOLA protection.
    const material = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            averageRate: rate ? {
              $cond: {
                if: { $eq: [{ $add: ["$totalReceived", Number(qty)] }, 0] },
                then: 0,
                else: {
                  $divide: [
                    { $add: [{ $multiply: ["$averageRate", "$totalReceived"] }, { $multiply: [Number(rate), Number(qty)] }] },
                    { $add: ["$totalReceived", Number(qty)] }
                  ]
                }
              }
            } : "$averageRate",
            totalReceived: { $add: ["$totalReceived", Number(qty)] },
            currentStock: { $add: ["$currentStock", Number(qty)] }
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
    res.status(500).json({ error: error.message });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    let result = null;

    // OPTIMIZATION: Use atomic findOneAndUpdate for all models to avoid read-modify-write cycle.
    // Each update is scoped to projectId for BOLA protection.
    if (type === 'MATERIAL') {
      result = await Material.findOneAndUpdate(
        { _id: id, project: projectId },
        { $set: { pdRemarks: remarks } }
      );
    } else if (type === 'SUBCONTRACTOR') {
      const { SubContractor } = await import('../models/SubContractor');
      result = await SubContractor.findOneAndUpdate(
        { _id: id, project: projectId },
        { $set: { pdRemarks: remarks } }
      );
    } else if (type === 'BILL') {
      const { Bill } = await import('../models/Bill');
      result = await Bill.findOneAndUpdate(
        { _id: id, project: projectId },
        { $set: { pdRemarks: remarks } }
      );
    }

    if (!result) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { receiveMaterial, updatePDRemarks };

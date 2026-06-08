import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // OPTIMIZATION: Use .exists() to avoid hydrating large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const numQty = Number(qty);
    const numRate = Number(rate || 0);

    /**
     * OPTIMIZATION: Atomic update using aggregation pipeline in findOneAndUpdate.
     * 1. Eliminates N+1 fetch-then-save roundtrip.
     * 2. Prevents BOLA by scoping lookup to projectId.
     * 3. Calculates weighted average rate atomically, avoiding race conditions.
     */
    const material = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            currentStock: { $add: ["$currentStock", numQty] },
            averageRate: {
              $cond: [
                { $and: [{ $gt: [numRate, 0] }, { $gt: [{ $add: ["$totalReceived", numQty] }, 0] }] },
                {
                  $divide: [
                    { $add: [{ $multiply: ["$averageRate", "$totalReceived"] }, { $multiply: [numQty, numRate] }] },
                    { $add: ["$totalReceived", numQty] }
                  ]
                },
                "$averageRate"
              ]
            },
            totalReceived: { $add: ["$totalReceived", numQty] }
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
    console.error('Error in receiveMaterial:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    // OPTIMIZATION: Use findOneAndUpdate with atomic $set to eliminate fetch-then-save cycle.
    // Also enforces BOLA protection by scoping lookup to projectId.
    let updated = null;

    if (type === 'MATERIAL') {
      updated = await Material.findOneAndUpdate({ _id: id, project: projectId }, { $set: { pdRemarks: remarks } });
    } else if (type === 'SUBCONTRACTOR') {
      const { SubContractor } = await import('../models/SubContractor');
      updated = await SubContractor.findOneAndUpdate({ _id: id, project: projectId }, { $set: { pdRemarks: remarks } });
    } else if (type === 'BILL') {
      const { Bill } = await import('../models/Bill');
      updated = await Bill.findOneAndUpdate({ _id: id, project: projectId }, { $set: { pdRemarks: remarks } });
    }

    if (!updated) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    console.error('Error in updatePDRemarks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

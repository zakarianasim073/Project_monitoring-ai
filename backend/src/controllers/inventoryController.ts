import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    const incomingQty = Number(qty);
    const incomingRate = Number(rate || 0);

    if (isNaN(incomingQty) || incomingQty <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    // Bolt Optimization: Use atomic findOneAndUpdate with aggregation pipeline to:
    // 1. Eliminate race conditions
    // 2. Fix the weighted average calculation bug (old formula used updated totalReceived)
    // 3. Remove redundant Project lookup (access already verified by middleware)
    // 4. Enforce BOLA by scoping query to project
    const material = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            averageRate: {
              $cond: {
                if: { $gt: [incomingRate, 0] },
                then: {
                  $divide: [
                    {
                      $add: [
                        { $multiply: ["$totalReceived", "$averageRate"] },
                        { $multiply: [incomingQty, incomingRate] }
                      ]
                    },
                    { $add: ["$totalReceived", incomingQty] }
                  ]
                },
                else: "$averageRate"
              }
            },
            totalReceived: { $add: ["$totalReceived", incomingQty] },
            currentStock: { $add: ["$currentStock", incomingQty] }
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
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    // Bolt Optimization: Replace fetch-then-save with single updateOne to reduce DB roundtrips and memory overhead.
    // Also enforcing BOLA by including project: projectId in the filter.
    let result;
    const filter = { _id: id, project: projectId };
    const update = { pdRemarks: remarks };

    if (type === 'MATERIAL') {
      result = await Material.updateOne(filter, update);
    } else if (type === 'SUBCONTRACTOR') {
      const { SubContractor } = await import('../models/SubContractor');
      result = await SubContractor.updateOne(filter, update);
    } else if (type === 'BILL') {
      const { Bill } = await import('../models/Bill');
      result = await Bill.updateOne(filter, update);
    }

    if (!result || result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found or access denied' });
    }

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

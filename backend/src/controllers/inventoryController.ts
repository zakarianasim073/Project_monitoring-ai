import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';
import { SubContractor } from '../models/SubContractor';
import { Bill } from '../models/Bill';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // Faster validation without hydrating large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // Atomic update using aggregation pipeline to prevent race conditions and N+1 hydration
    // Formula: (oldAverage * oldTotal + newRate * newQty) / (oldTotal + newQty)
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            averageRate: {
              $cond: {
                if: { $gt: [Number(rate || 0), 0] },
                then: {
                  $divide: [
                    { $add: [{ $multiply: ["$averageRate", "$totalReceived"] }, (Number(rate || 0) * Number(qty))] },
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

    if (!updatedMaterial) return res.status(404).json({ error: 'Material not found' });

    res.json({
      success: true,
      message: `Received ${qty} ${updatedMaterial.unit} of ${updatedMaterial.name}`,
      material: updatedMaterial
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    let result: any = null;

    // Use updateOne to avoid unnecessary document hydration and N+1 query patterns
    const update = { $set: { pdRemarks: remarks } };
    const query = { _id: id, project: projectId };

    if (type === 'MATERIAL') {
      result = await Material.updateOne(query, update);
    } else if (type === 'SUBCONTRACTOR') {
      result = await SubContractor.updateOne(query, update);
    } else if (type === 'BILL') {
      result = await Bill.updateOne(query, update);
    }

    if (!result || result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

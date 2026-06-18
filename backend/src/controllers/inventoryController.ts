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

    const q = Number(qty);
    const r = Number(rate) || 0;

    // Use atomic aggregation pipeline to update stock and weighted average in one roundtrip
    // This also fixes the BOLA vulnerability by scoping to projectId
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            averageRate: {
              $cond: {
                if: { $gt: [r, 0] },
                then: {
                  $divide: [
                    { $add: [{ $multiply: ["$averageRate", "$totalReceived"] }, (r * q)] },
                    { $add: ["$totalReceived", q] }
                  ]
                },
                else: "$averageRate"
              }
            },
            totalReceived: { $add: ["$totalReceived", q] },
            currentStock: { $add: ["$currentStock", q] }
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
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    let result;

    // Optimize by using updateOne instead of findById + save
    // Enforce BOLA by scoping to projectId
    if (type === 'MATERIAL') {
      result = await Material.updateOne({ _id: id, project: projectId }, { pdRemarks: remarks });
    } else if (type === 'SUBCONTRACTOR') {
      const { SubContractor } = await import('../models/SubContractor');
      result = await SubContractor.updateOne({ _id: id, project: projectId }, { pdRemarks: remarks });
    } else if (type === 'BILL') {
      const { Bill } = await import('../models/Bill');
      result = await Bill.updateOne({ _id: id, project: projectId }, { pdRemarks: remarks });
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

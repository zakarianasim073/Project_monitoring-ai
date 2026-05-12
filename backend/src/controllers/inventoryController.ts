import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';
import { SubContractor } from '../models/SubContractor';
import { Bill } from '../models/Bill';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // OPTIMIZATION: Use findOneAndUpdate with an aggregation pipeline for atomic updates and correct weighted average calculation.
    // This eliminates race conditions and the need for hydration.
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            totalReceived: { $add: ["$totalReceived", Number(qty)] },
            currentStock: { $add: ["$currentStock", Number(qty)] },
            averageRate: rate
              ? {
                  $divide: [
                    {
                      $add: [
                        { $multiply: ["$averageRate", "$totalReceived"] },
                        { $multiply: [Number(rate), Number(qty)] }
                      ]
                    },
                    { $add: ["$totalReceived", Number(qty)] }
                  ]
                }
              : "$averageRate"
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
    res.status(500).json({ error: error.message });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    // OPTIMIZATION: Replaced dynamic imports with static ones at the top.
    // Replaced findById + save with direct updateOne to avoid hydration.
    let updateResult;

    if (type === 'MATERIAL') {
      updateResult = await Material.updateOne({ _id: id, project: projectId }, { pdRemarks: remarks });
    } else if (type === 'SUBCONTRACTOR') {
      updateResult = await SubContractor.updateOne({ _id: id, project: projectId }, { pdRemarks: remarks });
    } else if (type === 'BILL') {
      updateResult = await Bill.updateOne({ _id: id, project: projectId }, { pdRemarks: remarks });
    }

    if (!updateResult || updateResult.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { receiveMaterial, updatePDRemarks };

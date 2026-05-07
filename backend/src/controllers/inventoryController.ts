import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';
import { SubContractor } from '../models/SubContractor';
import { Bill } from '../models/Bill';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // OPTIMIZATION: Use .exists() to avoid hydrating the large Project document
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // OPTIMIZATION: Use atomic findOneAndUpdate with aggregation pipeline to:
    // 1. Eliminate N+1-like hydration overhead (Material document is not fully loaded)
    // 2. Fix the race condition and logic flaw where weighted average used updated totalReceived
    // 3. Ensure all updates happen in a single database roundtrip
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            totalReceived: { $add: ["$totalReceived", Number(qty)] },
            currentStock: { $add: ["$currentStock", Number(qty)] },
            averageRate: rate ? {
              $divide: [
                { $add: [
                  { $multiply: ["$averageRate", "$totalReceived"] }, // Old total value
                  { $multiply: [Number(rate), Number(qty)] }        // New receipt value
                ]},
                { $add: ["$totalReceived", Number(qty)] }           // New total received
              ]
            } : "$averageRate"
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

    let Model: any = null;

    if (type === 'MATERIAL') {
      Model = Material;
    } else if (type === 'SUBCONTRACTOR') {
      Model = SubContractor;
    } else if (type === 'BILL') {
      Model = Bill;
    }

    if (!Model) return res.status(400).json({ error: 'Invalid type' });

    // OPTIMIZATION: Use updateOne to avoid full document hydration and save() roundtrip
    const result = await Model.updateOne(
      { _id: id, project: projectId },
      { $set: { pdRemarks: remarks } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { receiveMaterial, updatePDRemarks };

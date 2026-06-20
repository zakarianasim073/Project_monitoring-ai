import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // Use .exists() for faster check - Bolt optimization
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // Atomic update with aggregation pipeline - Bolt optimization
    // Fixes weighted average logic (previously used post-increment totalReceived)
    // Enforces BOLA by scoping to projectId
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            totalReceived: { $add: ["$totalReceived", Number(qty)] },
            currentStock: { $add: ["$currentStock", Number(qty)] },
            averageRate: rate ? {
              $divide: [
                {
                  $add: [
                    { $multiply: ["$averageRate", "$totalReceived"] },
                    { $multiply: [Number(rate), Number(qty)] }
                  ]
                },
                { $add: ["$totalReceived", Number(qty)] }
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
    console.error(error);
    // Generic error to prevent info disclosure - Sentinel requirement
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    // Use updateOne with project scoping for BOLA - Bolt optimization
    let result: any = null;

    if (type === 'MATERIAL') {
      result = await Material.updateOne({ _id: id, project: projectId }, { $set: { pdRemarks: remarks } });
    } else if (type === 'SUBCONTRACTOR') {
      const { SubContractor } = await import('../models/SubContractor');
      result = await SubContractor.updateOne({ _id: id, project: projectId }, { $set: { pdRemarks: remarks } });
    } else if (type === 'BILL') {
      const { Bill } = await import('../models/Bill');
      result = await Bill.updateOne({ _id: id, project: projectId }, { $set: { pdRemarks: remarks } });
    }

    if (!result || result.matchedCount === 0) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    console.error(error);
    // Generic error to prevent info disclosure - Sentinel requirement
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

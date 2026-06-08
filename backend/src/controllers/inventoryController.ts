import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // Use .exists() to avoid hydrating large project arrays (Performance Optimization)
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // Atomic update using aggregation pipeline for weighted average (Performance & Accuracy Optimization)
    // This prevents N+1 issues and ensures the calculation uses pre-update values correctly
    const material = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
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
            } : "$averageRate",
            totalReceived: { $add: ["$totalReceived", Number(qty)] },
            currentStock: { $add: ["$currentStock", Number(qty)] }
          }
        }
      ],
      { new: true }
    );

    if (!material) return res.status(404).json({ error: 'Material not found or not associated with this project' });

    res.json({
      success: true,
      message: `Received ${qty} ${material.unit} of ${material.name}`,
      material
    });

  } catch (error: any) {
    // Information Leakage Prevention: Log error but return generic message
    console.error(`Error in receiveMaterial: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    // Use findOneAndUpdate with projectId scoping to prevent BOLA and improve performance (no hydration)
    let updated = null;
    const filter = { _id: id, project: projectId };
    const update = { $set: { pdRemarks: remarks } };

    if (type === 'MATERIAL') {
      updated = await Material.findOneAndUpdate(filter, update);
    } else if (type === 'SUBCONTRACTOR') {
      const { SubContractor } = await import('../models/SubContractor');
      updated = await SubContractor.findOneAndUpdate(filter, update);
    } else if (type === 'BILL') {
      const { Bill } = await import('../models/Bill');
      updated = await Bill.findOneAndUpdate(filter, update);
    }

    if (!updated) return res.status(404).json({ error: 'Item not found or unauthorized' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    console.error(`Error in updatePDRemarks: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

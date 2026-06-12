import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // OPTIMIZATION: Use .exists() to avoid hydrating large Project document
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // OPTIMIZATION: Use atomic findOneAndUpdate with aggregation pipeline
    // This eliminates N+1 queries, prevents race conditions, and avoids full hydration.
    // SECURITY: Scoped to projectId to prevent BOLA
    const material = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            totalReceived: { $add: ["$totalReceived", Number(qty)] },
            currentStock: { $add: ["$currentStock", Number(qty)] },
            averageRate: {
              $cond: [
                { $gt: [Number(rate || 0), 0] },
                {
                  $divide: [
                    {
                      $add: [
                        { $multiply: ["$averageRate", "$totalReceived"] },
                        { $multiply: [Number(rate), Number(qty)] }
                      ]
                    },
                    { $add: ["$totalReceived", Number(qty)] }
                  ]
                },
                "$averageRate"
              ]
            }
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
    // SECURITY: Standardize on generic error to avoid leaking implementation details
    console.error('receiveMaterial error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    // OPTIMIZATION: Use .exists() to avoid hydrating large Project document
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    let target: any = null;

    // OPTIMIZATION: Use atomic findOneAndUpdate to avoid full hydration and N+1 overhead
    // SECURITY: Scoped to projectId to prevent BOLA
    if (type === 'MATERIAL') {
      target = await Material.findOneAndUpdate({ _id: id, project: projectId }, { pdRemarks: remarks });
    } else if (type === 'SUBCONTRACTOR') {
      const { SubContractor } = await import('../models/SubContractor');
      target = await SubContractor.findOneAndUpdate({ _id: id, project: projectId }, { pdRemarks: remarks });
    } else if (type === 'BILL') {
      const { Bill } = await import('../models/Bill');
      target = await Bill.findOneAndUpdate({ _id: id, project: projectId }, { pdRemarks: remarks });
    }

    if (!target) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    // SECURITY: Standardize on generic error to avoid leaking implementation details
    console.error('updatePDRemarks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

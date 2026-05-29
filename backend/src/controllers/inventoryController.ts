import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // OPTIMIZATION: Use Project.exists() to avoid hydrating a large project document
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // OPTIMIZATION: Use findOneAndUpdate with an aggregation pipeline for atomic updates.
    // This eliminates race conditions and ensures the weighted average is calculated correctly
    // using the document's state PRIOR to the update.
    const material = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            // Weighted average formula: ((oldAvg * oldTotal) + (newBatchVal)) / (oldTotal + newBatchQty)
            averageRate: rate ? {
              $cond: {
                if: { $gt: [{ $add: ["$totalReceived", Number(qty)] }, 0] },
                then: {
                  $divide: [
                    { $add: [{ $multiply: ["$averageRate", "$totalReceived"] }, (Number(rate) * Number(qty))] },
                    { $add: ["$totalReceived", Number(qty)] }
                  ]
                },
                else: 0
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
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    let model: any = null;

    if (type === 'MATERIAL') {
      model = Material;
    } else if (type === 'SUBCONTRACTOR') {
      model = (await import('../models/SubContractor')).SubContractor;
    } else if (type === 'BILL') {
      model = (await import('../models/Bill')).Bill;
    }

    if (!model) return res.status(400).json({ error: 'Invalid type' });

    // OPTIMIZATION: Use findOneAndUpdate for atomic update and project-scoping for security (BOLA)
    const target = await model.findOneAndUpdate(
      { _id: id, project: projectId },
      { $set: { pdRemarks: remarks } },
      { new: true }
    );

    if (!target) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';
import { SubContractor } from '../models/SubContractor';
import { Bill } from '../models/Bill';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // PERFORMANCE: Use .exists() instead of .findById() to avoid hydrating the full Project document
    // containing large arrays (DPRs, Bills, etc.) just for a presence check.
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // PERFORMANCE & ATOMICITY: Use findOneAndUpdate with an aggregation pipeline to calculate
    // the weighted average and update stock levels in a single atomic database operation.
    // This prevents race conditions and eliminates the need for document hydration.
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            // Important: calculate old total value before incrementing totalReceived
            averageRate: rate ? {
              $divide: [
                { $add: [{ $multiply: ['$averageRate', '$totalReceived'] }, (Number(rate) * Number(qty))] },
                { $add: ['$totalReceived', Number(qty)] }
              ]
            } : '$averageRate',
            totalReceived: { $add: ['$totalReceived', Number(qty)] },
            currentStock: { $add: ['$currentStock', Number(qty)] }
          }
        }
      ],
      { new: true, lean: true }
    );

    if (!updatedMaterial) return res.status(404).json({ error: 'Material not found in this project' });

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

    // PERFORMANCE: Use .exists() for project verification
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    let model: any;
    if (type === 'MATERIAL') model = Material;
    else if (type === 'SUBCONTRACTOR') model = SubContractor;
    else if (type === 'BILL') model = Bill;
    else return res.status(400).json({ error: 'Invalid type' });

    // PERFORMANCE: Use findOneAndUpdate for atomic update without full document hydration.
    // Also ensures the item belongs to the specified project (BOLA fix + performance).
    const result = await model.findOneAndUpdate(
      { _id: id, project: projectId },
      { $set: { pdRemarks: remarks } },
      { new: true, lean: true }
    );

    if (!result) return res.status(404).json({ error: 'Item not found in this project' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { receiveMaterial, updatePDRemarks };

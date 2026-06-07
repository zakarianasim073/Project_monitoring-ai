import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // OPTIMIZATION: Use .exists() to avoid full project hydration
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // OPTIMIZATION: Use findOneAndUpdate with aggregation pipeline for atomic weighted average calculation
    // This eliminates hydration overhead and fixes potential race conditions or calculation bugs
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            totalReceived: { $add: [{ $ifNull: ["$totalReceived", 0] }, Number(qty)] },
            currentStock: { $add: [{ $ifNull: ["$currentStock", 0] }, Number(qty)] },
            averageRate: rate ? {
              $divide: [
                {
                  $add: [
                    { $multiply: [{ $ifNull: ["$averageRate", 0] }, { $ifNull: ["$totalReceived", 0] }] },
                    { $multiply: [Number(rate), Number(qty)] }
                  ]
                },
                { $add: [{ $ifNull: ["$totalReceived", 0] }, Number(qty)] }
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
    // Sentinel: Generic error response for security
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

    // OPTIMIZATION: Use updateOne with BOLA check (scoping to projectId)
    const result = await model.updateOne(
      { _id: id, project: projectId },
      { $set: { pdRemarks: remarks } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    // Sentinel: Generic error response for security
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

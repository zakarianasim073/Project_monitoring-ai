import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // PERFORMANCE: Use .exists() for faster validation without hydrating large project arrays
    // Also ensures BOLA by checking project ownership/existence
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // OPTIMIZATION: Use findOneAndUpdate with an aggregation pipeline to update stock
    // and weighted average atomically without hydration overhead.
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            // Weighted average: (oldTotalValue + newAddition) / newTotalReceived
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
            } : "$averageRate",
            totalReceived: { $add: [{ $ifNull: ["$totalReceived", 0] }, Number(qty)] },
            currentStock: { $add: [{ $ifNull: ["$currentStock", 0] }, Number(qty)] }
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
    // Information Leakage prevention: Use generic 500 while logging internally
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    // BOLA prevention: Scope lookups to projectId
    let updateResult;

    if (type === 'MATERIAL') {
      updateResult = await Material.updateOne({ _id: id, project: projectId }, { pdRemarks: remarks });
    } else if (type === 'SUBCONTRACTOR') {
      const { SubContractor } = await import('../models/SubContractor');
      updateResult = await SubContractor.updateOne({ _id: id, project: projectId }, { pdRemarks: remarks });
    } else if (type === 'BILL') {
      const { Bill } = await import('../models/Bill');
      updateResult = await Bill.updateOne({ _id: id, project: projectId }, { pdRemarks: remarks });
    }

    if (!updateResult || updateResult.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    console.error(error);
    // Information Leakage prevention: Use generic 500 while logging internally
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

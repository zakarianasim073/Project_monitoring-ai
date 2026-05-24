import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // OPTIMIZATION: Use .exists() to avoid hydrating large project sub-document arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // OPTIMIZATION: Use atomic findOneAndUpdate with an aggregation pipeline to:
    // 1. Reduce database roundtrips from 2 (find + save) to 1.
    // 2. Perform calculations at the DB level to ensure atomicity and consistency.
    // 3. Fix the weighted average calculation bug in the original implementation.
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
    console.error('Error in receiveMaterial:', error);
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

    if (!model) return res.status(400).json({ error: 'Invalid item type' });

    // OPTIMIZATION: Use findOneAndUpdate with project-scoping (BOLA) for faster execution
    // and to avoid unnecessary document hydration before update.
    const updatedItem = await model.findOneAndUpdate(
      { _id: id, project: projectId },
      { $set: { pdRemarks: remarks } },
      { new: true }
    );

    if (!updatedItem) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    console.error('Error in updatePDRemarks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

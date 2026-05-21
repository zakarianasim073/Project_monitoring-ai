import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';
import { SubContractor } from '../models/SubContractor';
import { Bill } from '../models/Bill';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // Use .exists() to avoid hydrating the full project document
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const quantity = Number(qty);
    const newRate = Number(rate || 0);

    // Atomic update with aggregation pipeline to:
    // 1. Avoid N+1 roundtrips (find + save)
    // 2. Prevent race conditions in stock/average calculations
    // 3. Fix weighted average logic bug (using old total for old weight)
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            averageRate: {
              $cond: {
                if: { $gt: [newRate, 0] },
                then: {
                  $divide: [
                    {
                      $add: [
                        { $multiply: ['$averageRate', '$totalReceived'] },
                        { $multiply: [newRate, quantity] }
                      ]
                    },
                    { $add: ['$totalReceived', quantity] }
                  ]
                },
                else: '$averageRate'
              }
            },
            totalReceived: { $add: ['$totalReceived', quantity] },
            currentStock: { $add: ['$currentStock', quantity] }
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
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    let model: any;
    if (type === 'MATERIAL') model = Material;
    else if (type === 'SUBCONTRACTOR') model = SubContractor;
    else if (type === 'BILL') model = Bill;
    else return res.status(400).json({ error: 'Invalid type' });

    // Atomic update scoped to project to prevent BOLA
    const result = await model.updateOne(
      { _id: id, project: projectId },
      { $set: { pdRemarks: remarks } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

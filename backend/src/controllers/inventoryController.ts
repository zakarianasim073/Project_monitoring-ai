import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';
import { SubContractor } from '../models/SubContractor';
import { Bill } from '../models/Bill';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // OPTIMIZATION: Use .exists() to avoid hydrating large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // Update stock and weighted average
    // Note: weighted average calculation needs old totalReceived, but we can do it in one atomic update
    // using an aggregation pipeline to ensure correctness and avoid race conditions.
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId },
      [
        {
          $set: {
            // Important: oldTotalValue must be calculated before totalReceived is incremented
            // We can do this by using the current value of totalReceived in the pipeline
            averageRate: {
              $cond: {
                if: { $and: [{ $gt: [Number(rate || 0), 0] }, { $gt: [Number(qty), 0] }] },
                then: {
                  $divide: [
                    {
                      $add: [
                        { $multiply: [{ $ifNull: ['$averageRate', 0] }, { $ifNull: ['$totalReceived', 0] }] },
                        { $multiply: [Number(rate || 0), Number(qty)] }
                      ]
                    },
                    { $add: [{ $ifNull: ['$totalReceived', 0] }, Number(qty)] }
                  ]
                },
                else: '$averageRate'
              }
            },
            totalReceived: { $add: [{ $ifNull: ['$totalReceived', 0] }, Number(qty)] },
            currentStock: { $add: [{ $ifNull: ['$currentStock', 0] }, Number(qty)] }
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

    let model: any = null;

    if (type === 'MATERIAL') {
      model = Material;
    } else if (type === 'SUBCONTRACTOR') {
      model = SubContractor;
    } else if (type === 'BILL') {
      model = Bill;
    }

    if (!model) return res.status(400).json({ error: 'Invalid type' });

    const updated = await model.updateOne({ _id: id }, { $set: { pdRemarks: remarks } });

    if (updated.matchedCount === 0) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { receiveMaterial, updatePDRemarks };

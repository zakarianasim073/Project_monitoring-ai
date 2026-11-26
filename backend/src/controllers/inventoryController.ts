import { Request, Response } from 'express';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    const numQty = Number(qty);
    const numRate = Number(rate) || 0;

    // OPTIMIZATION: Use atomic aggregation pipeline to update stock and weighted average in one trip.
    // This prevents race conditions and eliminates the need for redundant project/material lookups.
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            averageRate: {
              $cond: {
                if: { $gt: [numRate, 0] },
                then: {
                  $divide: [
                    { $add: [{ $multiply: ['$averageRate', '$totalReceived'] }, { $multiply: [numRate, numQty] }] },
                    { $add: ['$totalReceived', numQty] }
                  ]
                },
                else: '$averageRate'
              }
            },
            totalReceived: { $add: ['$totalReceived', numQty] },
            currentStock: { $add: ['$currentStock', numQty] }
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

    // OPTIMIZATION: Use updateOne with BOLA check (filter by projectId) to update remarks in one trip.
    const result = await model.updateOne(
      { _id: id, project: projectId },
      { $set: { pdRemarks: remarks } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

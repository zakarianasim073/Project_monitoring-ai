import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';
import { SubContractor } from '../models/SubContractor';
import { Bill } from '../models/Bill';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // PERFORMANCE: Use .exists() for faster validation without hydrating large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // PERFORMANCE: Atomic update with aggregation pipeline to correctly calculate weighted average and update stock
    // Eliminates race conditions and avoids N+1 read-before-write hydration
    const material = await Material.findOneAndUpdate(
      { _id: materialId },
      [
        {
          $set: {
            averageRate: {
              $cond: [
                { $gt: [Number(rate) || 0, 0] },
                {
                  $divide: [
                    { $add: [ { $multiply: ["$averageRate", "$totalReceived"] }, { $multiply: [Number(rate), Number(qty)] } ] },
                    { $add: ["$totalReceived", Number(qty)] }
                  ]
                },
                "$averageRate"
              ]
            },
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
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    let model: any;
    if (type === 'MATERIAL') model = Material;
    else if (type === 'SUBCONTRACTOR') model = SubContractor;
    else if (type === 'BILL') model = Bill;
    else return res.status(400).json({ error: 'Invalid type' });

    // PERFORMANCE: Use direct updateOne to avoid full document hydration and save() overhead
    const result = await model.updateOne({ _id: id }, { $set: { pdRemarks: remarks } });

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

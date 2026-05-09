import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';
import { SubContractor } from '../models/SubContractor';
import { Bill } from '../models/Bill';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // Use exists() for lightweight check to avoid full project document hydration
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // Atomic update using aggregation pipeline to correctly calculate weighted average and update stock.
    // This prevents race conditions and eliminates the need for findById followed by save().
    const material = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            averageRate: rate ? {
              $cond: {
                if: { $eq: [{ $add: ["$totalReceived", Number(qty)] }, 0] },
                then: 0,
                else: {
                  $divide: [
                    {
                      $add: [
                        { $multiply: ["$averageRate", "$totalReceived"] },
                        { $multiply: [Number(rate), Number(qty)] }
                      ]
                    },
                    { $add: ["$totalReceived", Number(qty)] }
                  ]
                }
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
    console.error('Error in receiveMaterial:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    // Use exists() for lightweight check to avoid full project document hydration
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    let updateResult;

    // Use direct updateOne calls to avoid unnecessary document hydration and reduce DB roundtrips.
    // Models are now statically imported at the top of the file.
    if (type === 'MATERIAL') {
      updateResult = await Material.updateOne({ _id: id, project: projectId }, { $set: { pdRemarks: remarks } });
    } else if (type === 'SUBCONTRACTOR') {
      updateResult = await SubContractor.updateOne({ _id: id, project: projectId }, { $set: { pdRemarks: remarks } });
    } else if (type === 'BILL') {
      updateResult = await Bill.updateOne({ _id: id, project: projectId }, { $set: { pdRemarks: remarks } });
    } else {
      return res.status(400).json({ error: 'Invalid type provided' });
    }

    if (!updateResult || updateResult.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    console.error('Error in updatePDRemarks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

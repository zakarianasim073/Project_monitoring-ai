import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // Atomic update for stock and weighted average rate
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId },
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
    res.status(500).json({ error: error.message });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    let target: any = null;

    if (type === 'MATERIAL') {
      target = await Material.findById(id);
    } else if (type === 'SUBCONTRACTOR') {
      target = await (await import('../models/SubContractor')).SubContractor.findById(id);
    } else if (type === 'BILL') {
      target = await (await import('../models/Bill')).Bill.findById(id);
    }

    if (!target) return res.status(404).json({ error: 'Item not found' });

    target.pdRemarks = remarks;
    await target.save();

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { receiveMaterial, updatePDRemarks };

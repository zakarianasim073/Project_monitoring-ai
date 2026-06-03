import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // BOLT OPTIMIZATION: Parallelize project validation and material update.
    // Use an aggregation pipeline in findOneAndUpdate to atomically update stock and
    // average rate in a single roundtrip, eliminating N+1 and hydration overhead.
    const [projectExists, updatedMaterial] = await Promise.all([
      Project.exists({ _id: projectId }),
      Material.findOneAndUpdate(
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
      )
    ]);

    if (!projectExists) return res.status(404).json({ error: 'Project not found' });
    if (!updatedMaterial) return res.status(404).json({ error: 'Material not found' });

    res.json({
      success: true,
      message: `Received ${qty} ${updatedMaterial.unit} of ${updatedMaterial.name}`,
      material: updatedMaterial
    });

  } catch (error: any) {
    // SENTINEL HARDENING: Log error and return generic message
    console.error('Inventory Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    let target: any = null;

    if (type === 'MATERIAL') {
      target = await Material.findOne({ _id: id, project: projectId });
    } else if (type === 'SUBCONTRACTOR') {
      const { SubContractor } = await import('../models/SubContractor');
      target = await SubContractor.findOne({ _id: id, project: projectId });
    } else if (type === 'BILL') {
      const { Bill } = await import('../models/Bill');
      target = await Bill.findOne({ _id: id, project: projectId });
    }

    if (!target) return res.status(404).json({ error: 'Item not found' });

    target.pdRemarks = remarks;
    await target.save();

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    // SENTINEL HARDENING: Log error and return generic message
    console.error('PD Remarks Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // Use .exists() for faster validation
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // Atomic update with aggregation pipeline to handle weighted average and prevent race conditions
    const updatePipeline: any[] = [
      {
        $set: {
          totalReceived: { $add: [{ $ifNull: ['$totalReceived', 0] }, Number(qty)] },
          currentStock: { $add: [{ $ifNull: ['$currentStock', 0] }, Number(qty)] }
        }
      }
    ];

    if (rate) {
      updatePipeline.push({
        $set: {
          averageRate: {
            $divide: [
              {
                $add: [
                  { $multiply: [{ $ifNull: ['$averageRate', 0] }, { $subtract: ['$totalReceived', Number(qty)] }] },
                  { $multiply: [Number(rate), Number(qty)] }
                ]
              },
              '$totalReceived'
            ]
          }
        }
      });
    }

    const material = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      updatePipeline,
      { new: true }
    );

    if (!material) return res.status(404).json({ error: 'Material not found or not part of this project' });

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

    // Scope lookup to projectId to fix BOLA
    const result = await model.updateOne(
      { _id: id, project: projectId },
      { $set: { pdRemarks: remarks } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found or not part of this project' });
    }

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

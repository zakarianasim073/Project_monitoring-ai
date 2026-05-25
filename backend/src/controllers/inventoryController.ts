import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // BOLT OPTIMIZATION: Use .exists() for hydration-free validation
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // BOLT OPTIMIZATION: Atomic findOneAndUpdate with aggregation pipeline to update stock and weighted average in one roundtrip
    // SECURITY: Project-scoped query to prevent BOLA
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            averageRate: {
              $cond: {
                if: { $gt: [Number(rate || 0), 0] },
                then: {
                  $divide: [
                    { $add: [{ $multiply: ['$averageRate', '$totalReceived'] }, (Number(rate || 0) * Number(qty))] },
                    { $add: ['$totalReceived', Number(qty)] }
                  ]
                },
                else: '$averageRate'
              }
            },
            totalReceived: { $add: ['$totalReceived', Number(qty)] },
            currentStock: { $add: ['$currentStock', Number(qty)] }
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

    let model: any;
    if (type === 'MATERIAL') {
      model = Material;
    } else if (type === 'SUBCONTRACTOR') {
      model = (await import('../models/SubContractor')).SubContractor;
    } else if (type === 'BILL') {
      model = (await import('../models/Bill')).Bill;
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    // BOLT OPTIMIZATION: Atomic update with project-scoping for BOLA protection
    const updated = await model.findOneAndUpdate(
      { _id: id, project: projectId },
      { $set: { pdRemarks: remarks } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    console.error('Error in updatePDRemarks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

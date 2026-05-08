import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';
import { SubContractor } from '../models/SubContractor';
import { Bill } from '../models/Bill';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // Atomic update with weighted average calculation
    // Using aggregation pipeline to ensure atomicity and fix weighted average logic flaw
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId, project: projectId },
      [
        {
          $set: {
            totalReceived: { $add: ["$totalReceived", Number(qty)] },
            currentStock: { $add: ["$currentStock", Number(qty)] },
            averageRate: rate ? {
              $let: {
                vars: {
                  newTotalReceived: { $add: ["$totalReceived", Number(qty)] },
                  oldTotalValue: { $multiply: ["$averageRate", "$totalReceived"] }
                },
                in: {
                  $cond: {
                    if: { $eq: ["$$newTotalReceived", 0] },
                    then: 0,
                    else: {
                      $divide: [
                        { $add: ["$$oldTotalValue", { $multiply: [Number(rate), Number(qty)] }] },
                        "$$newTotalReceived"
                      ]
                    }
                  }
                }
              }
            } : "$averageRate"
          }
        }
      ],
      { new: true }
    );

    if (!updatedMaterial) return res.status(404).json({ error: 'Material not found or project mismatch' });

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

    let Model: any;
    if (type === 'MATERIAL') Model = Material;
    else if (type === 'SUBCONTRACTOR') Model = SubContractor;
    else if (type === 'BILL') Model = Bill;
    else return res.status(400).json({ error: 'Invalid type' });

    // OPTIMIZATION: Use updateOne directly to avoid full document hydration and multiple DB roundtrips
    // Also include project in query for BOLA security
    const result = await Model.updateOne(
      { _id: id, project: projectId },
      { $set: { pdRemarks: remarks } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found or project mismatch' });
    }

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { receiveMaterial, updatePDRemarks };

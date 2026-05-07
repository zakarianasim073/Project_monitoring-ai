import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';
import { SubContractor } from '../models/SubContractor';
import { Bill } from '../models/Bill';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // BOLT OPTIMIZATION: Use exists() to avoid hydrating the massive Project aggregate root
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // BOLT OPTIMIZATION: Use an atomic aggregation pipeline in findOneAndUpdate to:
    // 1. Correctly calculate weighted average without race conditions
    // 2. Update stock levels in one operation
    // 3. Fix the logic flaw where totalReceived was incremented before the value calculation
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: materialId },
      [
        {
          $set: {
            // New Weighted Average = (oldAvg * oldQty + newReceiptVal) / (oldQty + newReceiptQty)
            averageRate: rate ? {
              $divide: [
                { $add: [{ $multiply: ['$averageRate', '$totalReceived'] }, (Number(rate) * Number(qty))] },
                { $add: ['$totalReceived', Number(qty)] }
              ]
            } : '$averageRate',
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
    res.status(500).json({ error: error.message });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    // BOLT OPTIMIZATION: Use a direct updateOne to avoid findById + save overhead
    let model: any = null;
    if (type === 'MATERIAL') model = Material;
    else if (type === 'SUBCONTRACTOR') model = SubContractor;
    else if (type === 'BILL') model = Bill;

    if (!model) return res.status(400).json({ error: 'Invalid type' });

    const result = await model.updateOne({ _id: id }, { $set: { pdRemarks: remarks } });

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { receiveMaterial, updatePDRemarks };

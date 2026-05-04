import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';
import { SubContractor } from '../models/SubContractor';
import { Bill } from '../models/Bill';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // OPTIMIZATION: Use .exists() for existence check
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const material = await Material.findOne({ _id: materialId, project: projectId });
    if (!material) return res.status(404).json({ error: 'Material not found' });

    if (rate) {
      // Update average rate (weighted average)
      // FIX: Calculate oldTotalValue BEFORE updating totalReceived
      const oldTotalValue = (material.averageRate || 0) * (material.totalReceived || 0);
      const newTotalValue = oldTotalValue + (Number(rate) * Number(qty));
      material.totalReceived += Number(qty);
      material.averageRate = newTotalValue / material.totalReceived;
    } else {
      material.totalReceived += Number(qty);
    }

    // Update stock
    material.currentStock += Number(qty);

    await material.save();

    res.json({
      success: true,
      message: `Received ${qty} ${material.unit} of ${material.name}`,
      material
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePDRemarks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, id, remarks } = req.body; // type: 'MATERIAL' | 'SUBCONTRACTOR' | 'BILL'

    // OPTIMIZATION: Removed slow dynamic imports.
    // OPTIMIZATION: Use updateOne for direct update instead of hydrating then saving.
    let model: any = null;

    if (type === 'MATERIAL') {
      model = Material;
    } else if (type === 'SUBCONTRACTOR') {
      model = SubContractor;
    } else if (type === 'BILL') {
      model = Bill;
    }

    if (!model) return res.status(400).json({ error: 'Invalid type' });

    const result = await model.updateOne(
      { _id: id, project: projectId },
      { $set: { pdRemarks: remarks } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { receiveMaterial, updatePDRemarks };

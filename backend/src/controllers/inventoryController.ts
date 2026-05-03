import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';
import { SubContractor } from '../models/SubContractor';
import { Bill } from '../models/Bill';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // OPTIMIZATION: Use .exists() to avoid hydrating large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const material = await Material.findById(materialId);
    if (!material) return res.status(404).json({ error: 'Material not found' });

    if (rate) {
      // OPTIMIZATION & BUG FIX: Calculate oldTotalValue BEFORE updating totalReceived
      // to ensure weighted average accuracy.
      const oldTotalValue = material.averageRate * material.totalReceived;
      const newTotalReceived = material.totalReceived + Number(qty);
      const newTotalValue = oldTotalValue + (Number(rate) * Number(qty));
      material.averageRate = newTotalValue / newTotalReceived;
    }

    // Update stock
    material.totalReceived += Number(qty);
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

    let target: any = null;

    // OPTIMIZATION: Removed dynamic imports to eliminate per-request overhead
    if (type === 'MATERIAL') {
      target = await Material.findById(id);
    } else if (type === 'SUBCONTRACTOR') {
      target = await SubContractor.findById(id);
    } else if (type === 'BILL') {
      target = await Bill.findById(id);
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

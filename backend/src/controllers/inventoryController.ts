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

    const incomingQty = Number(qty);
    const incomingRate = Number(rate || 0);

    if (rate) {
      // OPTIMIZATION: Fix calculation order to ensure accurate weighted average
      const oldTotalReceived = material.totalReceived || 0;
      const newTotalReceived = oldTotalReceived + incomingQty;
      const oldTotalValue = (material.averageRate || 0) * oldTotalReceived;
      const newTotalValue = oldTotalValue + (incomingRate * incomingQty);
      material.averageRate = newTotalValue / newTotalReceived;
    }

    // Update stock
    material.totalReceived += incomingQty;
    material.currentStock += incomingQty;

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

    // OPTIMIZATION: Use .exists() for project validation
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // OPTIMIZATION: Avoid dynamic imports inside handlers and use atomic updateOne to avoid hydration
    let Model: any;
    if (type === 'MATERIAL') Model = Material;
    else if (type === 'SUBCONTRACTOR') Model = SubContractor;
    else if (type === 'BILL') Model = Bill;

    if (!Model) return res.status(400).json({ error: 'Invalid type' });

    const result = await Model.updateOne({ _id: id }, { $set: { pdRemarks: remarks } });
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { receiveMaterial, updatePDRemarks };

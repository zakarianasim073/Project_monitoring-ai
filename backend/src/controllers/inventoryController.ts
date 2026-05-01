import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const material = await Material.findById(materialId);
    if (!material) return res.status(404).json({ error: 'Material not found' });

    // Update stock
    material.totalReceived += Number(qty);
    material.currentStock += Number(qty);
    
    if (rate) {
      // Update average rate (weighted average)
      const oldTotalValue = material.averageRate * material.totalReceived;
      const newTotalValue = oldTotalValue + (Number(rate) * Number(qty));
      material.averageRate = newTotalValue / material.totalReceived;
    }

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

    let Model: any = null;

    if (type === 'MATERIAL') {
      Model = Material;
    } else if (type === 'SUBCONTRACTOR') {
      Model = (await import('../models/SubContractor')).SubContractor;
    } else if (type === 'BILL') {
      Model = (await import('../models/Bill')).Bill;
    }

    if (!Model) return res.status(400).json({ error: 'Invalid type' });

    // OPTIMIZATION: Use updateOne to update remarks directly without hydrating the whole document
    const result = await Model.updateOne({ _id: id }, { $set: { pdRemarks: remarks } });

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Item not found' });

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { receiveMaterial, updatePDRemarks };

import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // PERFORMANCE: Use .exists() and parallelize existence checks
    const [projectExists, material] = await Promise.all([
      Project.exists({ _id: projectId }),
      Material.findById(materialId)
    ]);

    if (!projectExists) return res.status(404).json({ error: 'Project not found' });
    if (!material) return res.status(404).json({ error: 'Material not found' });

    // Update stock and weighted average rate
    // Note: weighted average calculation requires the old totalReceived, so we keep the fetch-then-save
    // but we've parallelized the project existence check.
    const oldTotalReceived = material.totalReceived || 0;
    material.totalReceived = oldTotalReceived + Number(qty);
    material.currentStock = (material.currentStock || 0) + Number(qty);
    
    if (rate) {
      const oldTotalValue = (material.averageRate || 0) * oldTotalReceived;
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

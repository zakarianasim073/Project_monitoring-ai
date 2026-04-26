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

    // BOLA protection: scope lookup by project
    const material = await Material.findOne({ _id: materialId, project: projectId });
    if (!material) return res.status(404).json({ error: 'Material not found' });

    if (rate) {
      // Update average rate (weighted average) - calculate BEFORE incrementing totalReceived
      const oldTotalValue = material.averageRate * material.totalReceived;
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

    let target: any = null;

    // BOLA protection: scope lookup by project
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
    res.status(500).json({ error: error.message });
  }
};

export default { receiveMaterial, updatePDRemarks };

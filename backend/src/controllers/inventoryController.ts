import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // BOLA FIX: Ensure material belongs to the project
    const material = await Material.findOne({ _id: materialId, project: projectId });
    if (!material) return res.status(404).json({ error: 'Material not found in this project' });

    // Update stock
    material.totalReceived += Number(qty);
    material.currentStock += Number(qty);
    
    if (rate) {
      // Update average rate (weighted average)
      const oldTotalValue = material.averageRate * (material.totalReceived - Number(qty));
      const newTotalValue = oldTotalValue + (Number(rate) * Number(qty));
      material.averageRate = material.totalReceived > 0 ? newTotalValue / material.totalReceived : 0;
    }

    await material.save();

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

    let target: any = null;

    // BOLA FIX: Ensure target belongs to the project
    if (type === 'MATERIAL') {
      target = await Material.findOne({ _id: id, project: projectId });
    } else if (type === 'SUBCONTRACTOR') {
      const { SubContractor } = await import('../models/SubContractor');
      target = await SubContractor.findOne({ _id: id, project: projectId });
    } else if (type === 'BILL') {
      const { Bill } = await import('../models/Bill');
      target = await Bill.findOne({ _id: id, project: projectId });
    }

    if (!target) return res.status(404).json({ error: 'Item not found in this project' });

    target.pdRemarks = remarks;
    await target.save();

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { receiveMaterial, updatePDRemarks };

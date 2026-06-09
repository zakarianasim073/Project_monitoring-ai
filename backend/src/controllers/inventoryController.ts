import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // SECURITY: Scope lookup to projectId to prevent BOLA/IDOR (Insecure Direct Object Reference)
    const material = await Material.findOne({ _id: materialId, project: projectId });
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

    let target: any = null;

    // SECURITY: Use findOne with project constraint to prevent cross-project resource manipulation (BOLA protection)
    if (type === 'MATERIAL') {
      target = await Material.findOne({ _id: id, project: projectId });
    } else if (type === 'SUBCONTRACTOR') {
      target = await (await import('../models/SubContractor')).SubContractor.findOne({ _id: id, project: projectId });
    } else if (type === 'BILL') {
      target = await (await import('../models/Bill')).Bill.findOne({ _id: id, project: projectId });
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

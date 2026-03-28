import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';
import { SubContractor } from '../models/SubContractor';
import { Bill } from '../models/Bill';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

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

    let model: any = null;

    if (type === 'MATERIAL') {
      model = Material;
    } else if (type === 'SUBCONTRACTOR') {
      model = SubContractor;
    } else if (type === 'BILL') {
      model = Bill;
    }

    if (!model) return res.status(400).json({ error: 'Invalid type' });

    // Performance optimization: use updateOne instead of findById + save
    const result = await model.updateOne(
      { _id: id, project: projectId },
      { $set: { pdRemarks: remarks } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found in this project' });
    }

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { receiveMaterial, updatePDRemarks };

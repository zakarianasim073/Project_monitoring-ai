import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // Use Promise.all to run existence checks in parallel
    // Also scope material lookup by projectId for security (BOLA/IDOR prevention)
    const [projectExists, material] = await Promise.all([
      Project.exists({ _id: projectId }),
      Material.findOne({ _id: materialId, project: projectId })
    ]);

    if (!projectExists) return res.status(404).json({ error: 'Project not found' });
    if (!material) return res.status(404).json({ error: 'Material not found' });

    const numQty = Number(qty);

    if (rate) {
      const numRate = Number(rate);
      // Fixed weighted average logic: (oldVal + newVal) / newTotal
      const oldTotalValue = material.averageRate * material.totalReceived;
      const newTotalReceived = material.totalReceived + numQty;
      material.averageRate = (oldTotalValue + (numRate * numQty)) / newTotalReceived;
    }

    // Update stock values
    material.totalReceived += numQty;
    material.currentStock += numQty;

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

    let Model: any;
    if (type === 'MATERIAL') {
      Model = Material;
    } else if (type === 'SUBCONTRACTOR') {
      Model = (await import('../models/SubContractor')).SubContractor;
    } else if (type === 'BILL') {
      Model = (await import('../models/Bill')).Bill;
    }

    if (!Model) return res.status(400).json({ error: 'Invalid type' });

    // Use updateOne for better performance when we don't need the document returned
    const result = await Model.updateOne(
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

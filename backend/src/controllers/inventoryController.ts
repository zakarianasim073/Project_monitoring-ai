import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Material } from '../models/Material';
import { SubContractor } from '../models/SubContractor';
import { Bill } from '../models/Bill';

export const receiveMaterial = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { materialId, qty, rate } = req.body;

    // Parallelize existence checks and scope material by project for security
    const [projectExists, material] = await Promise.all([
      Project.exists({ _id: projectId }),
      Material.findOne({ _id: materialId, project: projectId })
    ]);

    if (!projectExists) return res.status(404).json({ error: 'Project not found' });
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

    let result;
    const filter = { _id: id, project: projectId };
    const update = { pdRemarks: remarks };

    // Use atomic updateOne to reduce DB round-trips and avoid document hydration
    if (type === 'MATERIAL') {
      result = await Material.updateOne(filter, update);
    } else if (type === 'SUBCONTRACTOR') {
      result = await SubContractor.updateOne(filter, update);
    } else if (type === 'BILL') {
      result = await Bill.updateOne(filter, update);
    }

    if (!result || result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true, message: 'Remarks updated by PD' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { receiveMaterial, updatePDRemarks };

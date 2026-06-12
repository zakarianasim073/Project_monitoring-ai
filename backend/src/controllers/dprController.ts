import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { DPR } from '../models/DPR';
import { BOQItem } from '../models/BOQItem';
import { Material } from '../models/Material';
import { Liability } from '../models/Liability';
import { SubContractor } from '../models/SubContractor';

// Create DPR with full automation
export const createDPR = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const dprData = req.body;

    // Use exists() to avoid full document hydration of large Project aggregate
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = await DPR.create({
      ...dprData,
      project: projectId,
    });

    const tasks: Promise<any>[] = [];
    const projectPushUpdates: any = { dprs: newDPR._id };

    // 2. Auto-update BOQ executed quantity (if linked)
    // SECURITY: Scope update to projectId for BOLA prevention
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock using bulkWrite for efficiency
    // SECURITY: Scope updates to projectId for BOLA prevention
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId, project: projectId },
          update: [
            {
              $set: {
                totalConsumed: { $add: [{ $ifNull: ["$totalConsumed", 0] }, Number(usage.qty)] },
                currentStock: {
                  $max: [0, { $subtract: [{ $ifNull: ["$currentStock", 0] }, Number(usage.qty)] }]
                }
              }
            }
          ]
        }
      }));
      tasks.push(Material.bulkWrite(materialOps));
    }

    // 4. Auto-create subcontractor liability (if linked)
    // SECURITY: Scope lookup to projectId for BOLA prevention
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      const subCon = await SubContractor.findOne({ _id: dprData.subContractorId, project: projectId });
      if (subCon) {
        const rateObj = subCon.agreedRates.find(r => r.boqId === dprData.linkedBoqId);
        const rate = rateObj ? (rateObj.rate || 0) : 0;
        const liabilityAmount = Number(dprData.workDoneQty) * rate;

        const newLiability = await Liability.create({
          project: projectId,
          description: `Sub-contractor work: ${dprData.activity}`,
          type: 'UNBILLED_WORK',
          amount: liabilityAmount,
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        });

        projectPushUpdates.liabilities = newLiability._id;
      }
    }

    // 5. Finalize parallel tasks and update project document atomically
    await Promise.all(tasks);
    await Project.updateOne(
      { _id: projectId },
      { $push: projectPushUpdates }
    );

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    // SECURITY: Use generic error message to prevent Information Leakage
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

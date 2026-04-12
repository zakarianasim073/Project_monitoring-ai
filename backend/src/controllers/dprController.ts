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

    // PERFORMANCE: Use exists() to avoid hydration of the entire project document
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const tasks: Promise<any>[] = [];
    const projectPushUpdates: any = {};

    // 1. Create DPR
    // Mongoose generates _id locally, so we can parallelize .save() and Project update
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    tasks.push(newDPR.save());
    projectPushUpdates.dprs = newDPR._id;

    // 2. Auto-update BOQ executed quantity (if linked)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      // SECURITY: Scope by projectId to prevent IDOR/BOLA
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      for (const usage of dprData.materialsUsed) {
        // SECURITY: Scope by projectId to prevent IDOR/BOLA
        // PERFORMANCE: Atomic update with aggregation pipeline for stock clamping
        tasks.push(Material.updateOne(
          { _id: usage.materialId, project: projectId },
          [
            {
              $set: {
                totalConsumed: { $add: [{ $ifNull: ["$totalConsumed", 0] }, Number(usage.qty)] },
                currentStock: { $max: [0, { $subtract: [{ $ifNull: ["$currentStock", 0] }, Number(usage.qty)] }] }
              }
            }
          ]
        ));
      }
    }

    // 4. Auto-create subcontractor liability (if linked)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // SECURITY: Scope by projectId to prevent IDOR/BOLA
      const subCon = await SubContractor.findOne({ _id: dprData.subContractorId, project: projectId });
      if (subCon) {
        const rateObj = subCon.agreedRates.find(r => r.boqId === dprData.linkedBoqId);
        const rate = rateObj ? (rateObj.rate || 0) : 0;
        const liabilityAmount = Number(dprData.workDoneQty) * rate;

        const newLiability = new Liability({
          project: projectId,
          description: `Sub-contractor work: ${dprData.activity}`,
          type: 'UNBILLED_WORK',
          amount: liabilityAmount,
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        });
        tasks.push(newLiability.save());
        projectPushUpdates.liabilities = newLiability._id;
      }
    }

    // PERFORMANCE: Parallelize all sub-tasks
    await Promise.all(tasks);

    // 5. Final Project update - sequential integrity for entity-parent relationship
    // Combine all pushes into one update to minimize database roundtrips
    if (Object.keys(projectPushUpdates).length > 0) {
      await Project.updateOne({ _id: projectId }, { $push: projectPushUpdates });
    }

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export default { createDPR };

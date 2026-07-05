import { Request, Response } from 'express';
import mongoose from 'mongoose';
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

    // Use .exists() to avoid hydrating large project aggregate
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const dprId = new mongoose.Types.ObjectId();
    const tasks: Promise<any>[] = [];
    const projectPushes: any = { dprs: dprId };

    // 1. Create DPR (Parallel)
    const newDPR = new DPR({
      ...dprData,
      _id: dprId,
      project: projectId,
    });
    tasks.push(newDPR.save());

    // 2. Atomic BOQ Update (Parallel)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Atomic Material Stock Deduction (Parallel - BulkWrite with aggregation pipeline for clamping)
    if (dprData.materialsUsed?.length > 0) {
      const bulkOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId, project: projectId },
          update: [{
            $set: {
              totalConsumed: { $add: [{ $ifNull: ['$totalConsumed', 0] }, Number(usage.qty)] },
              currentStock: { $max: [0, { $subtract: [{ $ifNull: ['$currentStock', 0] }, Number(usage.qty)] }] }
            }
          }]
        }
      }));
      tasks.push(Material.bulkWrite(bulkOps));
    }

    // 4. Sub-contractor Liability (Sequential lookup needed for rate, then Parallel save)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      const subCon = await SubContractor.findOne({ _id: dprData.subContractorId, project: projectId }).select('agreedRates');
      if (subCon) {
        const rateObj = subCon.agreedRates.find(r => r.boqId === dprData.linkedBoqId);
        const rate = rateObj?.rate || 0;
        const liabilityAmount = Number(dprData.workDoneQty) * rate;

        const liabilityId = new mongoose.Types.ObjectId();
        const newLiability = new Liability({
          _id: liabilityId,
          project: projectId,
          description: `Sub-contractor work: ${dprData.activity}`,
          type: 'UNBILLED_WORK',
          amount: liabilityAmount,
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        });
        tasks.push(newLiability.save());
        projectPushes.liabilities = liabilityId;
      }
    }

    // Execute all parallel tasks (DPR save, BOQ update, Material bulkWrite, Liability save)
    await Promise.all(tasks);

    // 5. Final Atomic Project Update (One single update for all links)
    await Project.updateOne({ _id: projectId }, { $push: projectPushes });

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

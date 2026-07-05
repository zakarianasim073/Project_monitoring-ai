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

    // Parallelize initial validation and lookups
    const [projectExists, subCon] = await Promise.all([
      Project.exists({ _id: projectId }),
      dprData.subContractorId ? SubContractor.findById(dprData.subContractorId).select('agreedRates') : Promise.resolve(null)
    ]);

    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const dprId = new mongoose.Types.ObjectId();
    const tasks: Promise<any>[] = [];
    const projectPush: any = { dprs: dprId };

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      _id: dprId,
      project: projectId,
    });
    tasks.push(newDPR.save());

    // 2. Auto-update BOQ executed quantity (if linked) - Atomic update
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock - Optimized with bulkWrite & aggregation pipeline
    if (dprData.materialsUsed?.length > 0) {
      const ops = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId },
          update: [
            {
              $set: {
                totalConsumed: { $add: [{ $ifNull: ['$totalConsumed', 0] }, Number(usage.qty)] },
                currentStock: { $max: [0, { $subtract: [{ $ifNull: ['$currentStock', 0] }, Number(usage.qty)] }] }
              }
            }
          ]
        }
      }));
      tasks.push(Material.bulkWrite(ops));
    }

    // 4. Auto-create subcontractor liability (if linked)
    if (subCon && dprData.workDoneQty && dprData.linkedBoqId) {
      const rateObj = subCon.agreedRates.find((r: any) => r.boqId === dprData.linkedBoqId);
      const rate = rateObj ? (rateObj.rate || 0) : 0;
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
      projectPush.liabilities = liabilityId;
    }

    // 5. Add references to project in a single atomic update
    tasks.push(Project.updateOne(
      { _id: projectId },
      { $push: projectPush }
    ));

    // Execute all tasks in parallel to minimize latency
    await Promise.all(tasks);

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

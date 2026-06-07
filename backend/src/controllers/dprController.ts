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

    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Prepare DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // 2. Parallelize independent operations (Optimized: Reducing database roundtrips)
    const tasks: Promise<any>[] = [newDPR.save()];

    // BOQ Update
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // Material updates (Optimized: Using bulkWrite)
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId },
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

    // Subcontractor Liability (Async sub-task)
    const liabilityTask = (async () => {
      if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
        const subCon = await SubContractor.findById(dprData.subContractorId);
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
          await newLiability.save();
          return newLiability._id;
        }
      }
      return null;
    })();
    tasks.push(liabilityTask);

    // Wait for all mutations to finish
    const results = await Promise.all(tasks);
    const createdLiabilityId = results[results.length - 1];

    // 3. Final atomic project linking (Optimized: No full document hydration/save)
    const projectUpdates: any = { $push: { dprs: newDPR._id } };
    if (createdLiabilityId) {
      projectUpdates.$push.liabilities = createdLiabilityId;
    }
    await Project.updateOne({ _id: projectId }, projectUpdates);

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

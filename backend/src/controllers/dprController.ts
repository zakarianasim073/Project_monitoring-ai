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

    // Use exists() to avoid hydrating large sub-document arrays (boq, dprs, etc.)
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // OPTIMIZATION: Parallelize independent database operations
    // This reduces total latency by executing saving, stock updates, and BOQ updates concurrently.
    const [liabilityId] = await Promise.all([
      // 4. Auto-create subcontractor liability (if linked)
      (async () => {
        if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
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
            await newLiability.save();
            return newLiability._id;
          }
        }
        return null;
      })(),

      // 1b. Save the DPR itself
      newDPR.save(),

      // 2. Auto-update BOQ executed quantity (if linked) - Optimized: Atomic update
      dprData.linkedBoqId && dprData.workDoneQty ?
        BOQItem.updateOne(
          { _id: dprData.linkedBoqId, project: projectId },
          { $inc: { executedQty: Number(dprData.workDoneQty) } }
        ) : Promise.resolve(),

      // 3. Auto-deduct material stock (Optimized: bulkWrite to eliminate N+1 queries)
      dprData.materialsUsed && dprData.materialsUsed.length > 0 ?
        Material.bulkWrite(dprData.materialsUsed.map((usage: any) => ({
          updateOne: {
            filter: { _id: usage.materialId, project: projectId },
            update: [{
              $set: {
                totalConsumed: { $add: [{ $ifNull: ["$totalConsumed", 0] }, Number(usage.qty)] },
                currentStock: {
                  $max: [0, { $subtract: [{ $ifNull: ["$currentStock", 0] }, Number(usage.qty)] }]
                }
              }
            }]
          }
        })) as any) : Promise.resolve()
    ]);

    // 5. Atomic project update: Link DPR and Liability in one call
    // This is done AFTER the parallel block because it depends on the liabilityId and DPR _id
    const projectUpdate: any = { $push: { dprs: newDPR._id } };
    if (liabilityId) {
      projectUpdate.$push.liabilities = liabilityId;
    }
    await Project.updateOne({ _id: projectId }, projectUpdate);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(`[createDPR Error]:`, error);
    // Standardize generic error to prevent Information Leakage
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

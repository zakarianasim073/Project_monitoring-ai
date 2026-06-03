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

    // OPTIMIZATION: Use .exists() to avoid hydrating large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Prepare DPR (instantiate to get _id early)
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // 2. Execute all side effects in parallel to minimize latency (Performance Boost)
    const results = await Promise.all([
      newDPR.save(),

      // Auto-update BOQ executed quantity (if linked)
      (async () => {
        if (dprData.linkedBoqId && dprData.workDoneQty) {
          // OPTIMIZATION: Use atomic update instead of find+save
          await BOQItem.updateOne(
            { _id: dprData.linkedBoqId },
            { $inc: { executedQty: Number(dprData.workDoneQty) } }
          );
        }
      })(),

      // Auto-deduct material stock
      (async () => {
        if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
          // OPTIMIZATION: Use bulkWrite to atomically update all materials in one roundtrip
          // and use aggregation pipeline for conditional currentStock capping
          const materialOps = dprData.materialsUsed.map((usage: any) => ({
            updateOne: {
              filter: { _id: usage.materialId },
              update: [
                {
                  $set: {
                    totalConsumed: { $add: [{ $ifNull: ["$totalConsumed", 0] }, Number(usage.qty)] },
                    currentStock: {
                      $max: [
                        0,
                        { $subtract: [{ $ifNull: ["$currentStock", 0] }, Number(usage.qty)] }
                      ]
                    }
                  }
                }
              ]
            }
          }));
          await Material.bulkWrite(materialOps);
        }
      })(),

      // Auto-create subcontractor liability (if linked)
      (async () => {
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
      })()
    ]);

    const liabilityId = results[3];

    // 3. Atomic project update to link resources (Performance Boost)
    const projectUpdates: any = { $push: { dprs: newDPR._id } };
    if (liabilityId) {
      projectUpdates.$push.liabilities = liabilityId;
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

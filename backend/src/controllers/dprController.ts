import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { DPR } from '../models/DPR';
import { BOQItem } from '../models/BOQItem';
import { Material } from '../models/Material';
import { Liability } from '../models/Liability';
import { SubContractor } from '../models/SubContractor';

/**
 * BOLT OPTIMIZATION: createDPR
 * - Replaced Project.findById (hydrating large arrays) with Project.exists.
 * - Parallelized independent database operations using Promise.all after validation.
 * - Replaced N+1 Material updates with a single Material.bulkWrite using aggregation pipelines.
 * - Replaced BOQItem find+save with atomic $inc update.
 * - Consolidated Project updates into a single updateOne call.
 * - Enforced BOLA by scoping SubContractor lookup to projectId.
 * - Standardized generic 500 error response for security.
 */
export const createDPR = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const dprData = req.body;

    // 1. Validation First: Prevent side effects if project doesn't exist
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 2. Parallelize independent resource updates
    // Round 1: Concurrent I/O
    const [newDPR, subCon] = await Promise.all([
      DPR.create({ ...dprData, project: projectId }),
      dprData.subContractorId
        ? SubContractor.findOne({ _id: dprData.subContractorId, project: projectId })
        : Promise.resolve(null),
      dprData.linkedBoqId && dprData.workDoneQty
        ? BOQItem.updateOne(
            { _id: dprData.linkedBoqId, project: projectId },
            { $inc: { executedQty: Number(dprData.workDoneQty) } }
          )
        : Promise.resolve(null),
      dprData.materialsUsed?.length > 0
        ? Material.bulkWrite(dprData.materialsUsed.map((usage: any) => ({
            updateOne: {
              filter: { _id: usage.materialId, project: projectId },
              // Use aggregation pipeline to ensure currentStock doesn't go below 0 atomically
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
          })))
        : Promise.resolve(null)
    ]);

    let newLiabilityId = null;

    // 3. Sequential dependency (Liability depends on SubContractor rate)
    if (subCon && dprData.workDoneQty && dprData.linkedBoqId) {
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
      newLiabilityId = newLiability._id;
    }

    // 4. Final atomic link to Project
    const projectUpdate: any = { $push: { dprs: newDPR._id } };
    if (newLiabilityId) {
      projectUpdate.$push.liabilities = newLiabilityId;
    }

    await Project.updateOne({ _id: projectId }, projectUpdate);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR,
      data: newDPR // Maintain backward compatibility
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

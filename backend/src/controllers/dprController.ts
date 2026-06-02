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

    // 1. Use .exists() for faster validation without hydrating large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 2. Initialize DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // 3. Parallelize independent database operations
    // Performance: Parallelizing lookups and initial save minimizes latency
    const [savedDPR, boqUpdate, subCon] = await Promise.all([
      newDPR.save(),
      dprData.linkedBoqId && dprData.workDoneQty
        ? BOQItem.updateOne(
            { _id: dprData.linkedBoqId, project: projectId },
            { $inc: { executedQty: Number(dprData.workDoneQty) } }
          )
        : Promise.resolve(null),
      dprData.subContractorId
        ? SubContractor.findOne({ _id: dprData.subContractorId, project: projectId })
        : Promise.resolve(null)
    ]);

    // 4. Optimized Material Bulk Update (Aggregation Pipeline for atomic stock checks)
    // BOLT: Using bulkWrite with aggregation pipeline eliminates N+1 overhead and ensures atomic updates
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
      await Material.bulkWrite(materialOps);
    }

    // 5. Handle Subcontractor Liability & Project Linkage
    let newLiabilityId = null;
    if (subCon && dprData.workDoneQty && dprData.linkedBoqId) {
      const rateObj = subCon.agreedRates.find((r: any) => r.boqId === dprData.linkedBoqId);
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
      newLiabilityId = newLiability._id;
    }

    // 6. Atomic update to link DPR and Liability to project
    // Performance: Single updateOne with $push replaces multiple sequential .save() calls on hydrated project document
    const projectUpdates: any = { $push: { dprs: savedDPR._id } };
    if (newLiabilityId) {
      projectUpdates.$push.liabilities = newLiabilityId;
    }

    await Project.updateOne({ _id: projectId }, projectUpdates);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: savedDPR,
      data: savedDPR // Maintain backward compatibility
    });

  } catch (error: any) {
    console.error("Error in createDPR:", error);
    // Sentinel: Standardize generic error response to prevent Information Leakage
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

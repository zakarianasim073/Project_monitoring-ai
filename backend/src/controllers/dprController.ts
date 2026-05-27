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

    // OPTIMIZATION: Start independent lookups in parallel
    const projectExistsPromise = Project.exists({ _id: projectId });
    const subConPromise = (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId)
      ? SubContractor.findOne({ _id: dprData.subContractorId, project: projectId }).select('agreedRates')
      : Promise.resolve(null);

    const [projectExists, subCon] = await Promise.all([projectExistsPromise, subConPromise]);

    // Hydration-free existence check
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Prepare DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    const tasks: Promise<any>[] = [newDPR.save()];

    // 2. Atomic BOQ update (no hydration needed)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Optimized Material Stock Updates via bulkWrite
    // Eliminates N+1 queries and uses aggregation pipeline for atomic clamping
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

    // 4. Create Liability if SubContractor found
    let newLiabilityId: any = null;
    if (subCon) {
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

      tasks.push(newLiability.save());
      newLiabilityId = newLiability._id;
    }

    // Execute all updates in parallel
    await Promise.all(tasks);

    // 5. Final atomic update to Project
    const projectUpdate: any = { $push: { dprs: newDPR._id } };
    if (newLiabilityId) {
      projectUpdate.$push.liabilities = newLiabilityId;
    }
    await Project.updateOne({ _id: projectId }, projectUpdate);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    // Information Leakage Prevention: Generic error message
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

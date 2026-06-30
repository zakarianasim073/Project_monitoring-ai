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

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // ⚡ Bolt Optimization: Parallelize independent operations and use atomic updates
    // Use explicit Promise<any> typing to satisfy TypeScript for parallel execution
    const promises: Promise<any>[] = [newDPR.save()];

    // 2. Auto-update BOQ executed quantity (if linked) - ATOMIC
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      promises.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock - ATOMIC BULK
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const bulkOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId, project: projectId },
          // Use aggregation pipeline in update for atomic clamping
          update: [{
            $set: {
              totalConsumed: { $add: [{ $ifNull: ["$totalConsumed", 0] }, Number(usage.qty)] },
              currentStock: {
                $max: [0, { $subtract: [{ $ifNull: ["$currentStock", 0] }, Number(usage.qty)] }]
              }
            }
          }]
        }
      }));
      promises.push(Material.bulkWrite(bulkOps));
    }

    // 4. Subcontractor lookup (needed for liability)
    let subConPromise: Promise<any> = Promise.resolve(null);
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      subConPromise = SubContractor.findOne({ _id: dprData.subContractorId, project: projectId });
      promises.push(subConPromise);
    }

    // Execute parallel operations
    await Promise.all(promises);
    const subCon = await subConPromise;

    const projectUpdatePushes: any = { dprs: newDPR._id };

    // 4. Auto-create subcontractor liability (continued)
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
      await newLiability.save();
      projectUpdatePushes.liabilities = newLiability._id;
    }

    // 5. Final Project Update - ATOMIC PUSH
    await Project.updateOne(
      { _id: projectId },
      { $push: projectUpdatePushes }
    );

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    // Standardize to generic error to prevent info leaks (Sentinel pattern)
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

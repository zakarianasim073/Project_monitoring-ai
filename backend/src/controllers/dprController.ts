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

    // Optimization: Use exists() instead of findById() to avoid hydrating the massive Project document
    // which contains large arrays for bills, dprs, liabilities, etc. O(1) vs O(N) hydration.
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // Prepare tasks for parallel execution
    const tasks: Promise<any>[] = [newDPR.save()];
    const projectUpdatePushes: any = { dprs: newDPR._id };

    // 2. Auto-update BOQ executed quantity (if linked)
    // Security: Scoped lookup with projectId (BOLA mitigation)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock
    // Optimization: Replace N+1 updates with a single bulkWrite.
    // Also uses aggregation pipeline for atomic stock clamping (don't go below 0).
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

    // 4. Auto-create subcontractor liability (if linked)
    // Security: Scoped lookup with projectId (BOLA mitigation)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      const subConPromise = SubContractor.findOne({ _id: dprData.subContractorId, project: projectId })
        .then(async (subCon) => {
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
          return null;
        });

      tasks.push(subConPromise.then(liabilityId => {
        if (liabilityId) projectUpdatePushes.liabilities = liabilityId;
      }));
    }

    // Execute all sub-tasks in parallel
    await Promise.all(tasks);

    // 5. Atomic Project Update
    // Optimization: Combine all array pushes into a single atomic update.
    // This avoids multiple project.save() calls and document hydration overhead.
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
    res.status(500).json({ error: error.message });
  }
};

export default { createDPR };

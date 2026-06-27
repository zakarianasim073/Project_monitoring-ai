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

    // OPTIMIZATION: Use .exists() to avoid hydrating large sub-document arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Prepare DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    const tasks: Promise<any>[] = [];

    // Task 1: Save DPR
    tasks.push(newDPR.save());

    // 2. Auto-update BOQ executed quantity (if linked)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      // OPTIMIZATION: Atomic update scoped to project for BOLA protection
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      // OPTIMIZATION: Use bulkWrite with aggregation pipeline for atomic clamping and BOLA protection
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
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
      tasks.push(Material.bulkWrite(materialOps));
    }

    let liabilityId: any = null;
    const liabilityTask = (async () => {
      // 4. Auto-create subcontractor liability (if linked)
      if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
        // OPTIMIZATION: Use projection to fetch only necessary data and scope to project
        const subCon = await SubContractor.findOne(
          { _id: dprData.subContractorId, project: projectId },
          { agreedRates: 1 }
        );

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
          liabilityId = newLiability._id;
        }
      }
    })();
    tasks.push(liabilityTask);

    // Wait for all background tasks to complete
    await Promise.all(tasks);

    // 5. Atomic update to link DPR and Liability to project
    // OPTIMIZATION: Consolidate multiple project updates into one atomic operation
    const projectUpdates: any = {
      $push: {
        dprs: newDPR._id,
        ...(liabilityId && { liabilities: liabilityId })
      }
    };
    await Project.updateOne({ _id: projectId }, projectUpdates);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    // SECURITY: Standardize error response and log original error for observability
    console.error(`[createDPR Error]: ${error.message}`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

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

    // OPTIMIZATION: Parallelize project validation and subcontractor lookup
    // Scoping to project for BOLA protection and using projection to minimize data transfer
    const [projectExists, subCon] = await Promise.all([
      Project.exists({ _id: projectId }),
      dprData.subContractorId
        ? SubContractor.findOne({ _id: dprData.subContractorId, project: projectId }, { agreedRates: 1 })
        : Promise.resolve(null)
    ]);

    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // We'll collect all independent database tasks to run them in parallel
    const tasks: Promise<any>[] = [newDPR.save()];

    // 2. Auto-update BOQ executed quantity (if linked) - Atomic update
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock - Bulk atomic update to eliminate N+1 query problem
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId, project: projectId },
          // Using aggregation pipeline in update to mimic Math.max(0, currentStock - qty) logic
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
      tasks.push(Material.bulkWrite(materialOps));
    }

    // 4. Auto-create subcontractor liability (if linked)
    let newLiabilityId: any = null;
    if (subCon && dprData.workDoneQty && dprData.linkedBoqId) {
      const rateObj = subCon.agreedRates.find(r => r.boqId === dprData.linkedBoqId);
      const rate = rateObj ? (rateObj.rate || 0) : 0;
      const liabilityAmount = Number(dprData.workDoneQty) * rate;

      if (liabilityAmount > 0) {
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
    }

    // Execute all pending updates in parallel for maximum performance
    await Promise.all(tasks);

    // 5. Add references to project - Atomic update to avoid hydrating large project document
    const pushUpdates: any = { dprs: newDPR._id };
    if (newLiabilityId) {
      pushUpdates.liabilities = newLiabilityId;
    }

    await Project.updateOne(
      { _id: projectId },
      { $push: pushUpdates }
    );

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    // Generic error message for security (prevent stack trace leakage)
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

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

    // Use .exists() to avoid hydrating the full project document (performance)
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const operations: Promise<any>[] = [];
    const projectPushIds: { dprs?: any, liabilities?: any } = {};

    // 1. Prepare DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    operations.push(newDPR.save());
    projectPushIds.dprs = newDPR._id;

    // 2. Auto-update BOQ executed quantity (Atomic update)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      operations.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock (Bulk atomic update)
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId },
          update: {
            $inc: {
              totalConsumed: Number(usage.qty),
              currentStock: -Number(usage.qty)
            }
          }
        }
      }));
      // Note: currentStock can go negative if not clamped, but $inc is faster.
      // If clamping is required, use aggregation pipeline in update (Mongoose 4.2+ / MongoDB 4.2+)
      operations.push(Material.bulkWrite(materialOps));
    }

    // 4. Auto-create subcontractor liability (Optimized lookup)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      const subCon = await SubContractor.findById(dprData.subContractorId, { agreedRates: 1 });
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
        operations.push(newLiability.save());
        projectPushIds.liabilities = newLiability._id;
      }
    }

    // Execute independent operations in parallel
    await Promise.all(operations);

    // 5. Atomic update to project (Single roundtrip for all references)
    const projectUpdate: any = { $push: {} };
    if (projectPushIds.dprs) projectUpdate.$push.dprs = projectPushIds.dprs;
    if (projectPushIds.liabilities) projectUpdate.$push.liabilities = projectPushIds.liabilities;

    if (Object.keys(projectUpdate.$push).length > 0) {
      await Project.updateOne({ _id: projectId }, projectUpdate);
    }

    res.status(201).json({
      success: true,
      message: "DPR created with full automation (optimized)",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" }); // Generic error for security
  }
};

export default { createDPR };

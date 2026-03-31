import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { DPR } from '../models/DPR';
import { BOQItem } from '../models/BOQItem';
import { Material } from '../models/Material';
import { Liability } from '../models/Liability';
import { SubContractor } from '../models/SubContractor';

// Create DPR with full automation - Optimized for database performance
export const createDPR = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const dprData = req.body;

    // Use .exists() for faster initial validation without full document hydration
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Prepare DPR (Mongoose generates ID locally, allowing parallel operations)
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    const dbOps: Promise<any>[] = [newDPR.save()];

    // 2. Auto-update BOQ executed quantity (if linked) using atomic update
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      dbOps.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock using bulkWrite (atomic $inc) to avoid N+1 queries
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
      dbOps.push(Material.bulkWrite(materialOps));
    }

    // 4. Handle SubContractor Liability if applicable
    let liabilityId: any = null;
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // Use .lean() for faster read-only lookup
      const subCon = await SubContractor.findById(dprData.subContractorId).lean();
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

        dbOps.push(newLiability.save());
        liabilityId = newLiability._id;
      }
    }

    // Parallelize all independent database operations to reduce response time
    await Promise.all(dbOps);

    // 5. Finalize Project associations in a single atomic update
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

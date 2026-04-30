import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { DPR } from '../models/DPR';
import { BOQItem } from '../models/BOQItem';
import { Material } from '../models/Material';
import { Liability } from '../models/Liability';
import { SubContractor } from '../models/SubContractor';

/**
 * ⚡ Bolt Optimization:
 * 1. Replaced `Project.findById` with `Project.exists` to avoid heavy sub-document hydration.
 * 2. Used atomic `$inc` for BOQ item quantity updates to prevent race conditions and N+1 queries.
 * 3. Implemented `Material.bulkWrite` with aggregation pipeline for atomic stock clamping.
 * 4. Consolidated multiple `Project.save()` calls into a single `Project.updateOne`.
 * 5. Used `.lean()` for read-only SubContractor lookup.
 */
export const createDPR = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const dprData = req.body;

    // Use .exists() to avoid hydrating large arrays (boq, dprs, materials, etc.)
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    await newDPR.save();

    const projectUpdates: any = {
      $push: { dprs: newDPR._id }
    };

    // 2. Auto-update BOQ executed quantity (Atomic)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      await BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      );
    }

    // 3. Auto-deduct material stock (Bulk Atomic Operations)
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      await Material.bulkWrite(
        dprData.materialsUsed.map((usage: any) => ({
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
        }))
      );
    }

    // 4. Auto-create subcontractor liability
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
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
        await newLiability.save();

        // Queue liability for single project update
        projectUpdates.$push.liabilities = newLiability._id;
      }
    }

    // 5. Consolidated Project Update
    await Project.updateOne({ _id: projectId }, projectUpdates);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation (optimized)",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export default { createDPR };

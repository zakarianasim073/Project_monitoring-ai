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

    // PERFORMANCE: Use .exists() for presence check to avoid hydrating large project sub-documents
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    await newDPR.save();

    // Prepare push operations for Project model to execute in a single roundtrip
    const projectPushOps: any = { dprs: newDPR._id };

    // 2. Auto-update BOQ executed quantity (if linked)
    // PERFORMANCE: Atomic $inc instead of find + hydration + save
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      await BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      );
    }

    // 3. Auto-deduct material stock
    // PERFORMANCE: BulkWrite eliminates N+1 query problem for materials used
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId },
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

    // 4. Auto-create subcontractor liability (if linked)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      const subCon = await SubContractor.findById(dprData.subContractorId);
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

        projectPushOps.liabilities = newLiability._id;
      }
    }

    // 5. Final atomic update to project links
    // PERFORMANCE: Combined update reduces database roundtrips
    await Project.updateOne({ _id: projectId }, { $push: projectPushOps });

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

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

    // PERFORMANCE: Use .exists() to avoid hydrating massive project sub-document arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    await newDPR.save();

    // 2. Auto-update BOQ executed quantity (if linked)
    // OPTIMIZATION: Use atomic $inc to avoid hydration/save overhead
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      await BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      );
    }

    // 3. Auto-deduct material stock
    // OPTIMIZATION: Use bulkWrite with aggregation pipeline for atomic updates and clamping
    // This eliminates N+1 query problem for multiple materials
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
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
      }));
      await Material.bulkWrite(materialOps);
    }

    // 4. Auto-create subcontractor liability (if linked)
    let newLiabilityId = null;
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
        newLiabilityId = newLiability._id;
      }
    }

    // 5. Add DPR and Liability to project
    // OPTIMIZATION: Single updateOne for all project links instead of multiple .save() calls
    const projectPush: any = { dprs: newDPR._id };
    if (newLiabilityId) {
      projectPush.liabilities = newLiabilityId;
    }

    await Project.updateOne(
      { _id: projectId },
      { $push: projectPush }
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

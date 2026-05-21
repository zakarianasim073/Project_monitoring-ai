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

    // ⚡ BOLT OPTIMIZATION: Use .exists() for faster validation without hydrating large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    await newDPR.save();

    // 2. Auto-update BOQ executed quantity (if linked)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      // ⚡ BOLT OPTIMIZATION: Atomic update to avoid findById + save()
      await BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      );
    }

    // 3. Auto-deduct material stock
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      // ⚡ BOLT OPTIMIZATION: Use bulkWrite with aggregation pipeline for atomic stock updates and clamping
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId },
          update: [
            {
              $set: {
                totalConsumed: { $add: [{ $ifNull: ['$totalConsumed', 0] }, Number(usage.qty)] },
                currentStock: {
                  $max: [0, { $subtract: [{ $ifNull: ['$currentStock', 0] }, Number(usage.qty)] }]
                }
              }
            }
          ]
        }
      }));
      await Material.bulkWrite(materialOps);
    }

    const liabilityIds: any[] = [];

    // 4. Auto-create subcontractor liability (if linked)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // ⚡ BOLT OPTIMIZATION: Use .select() to only fetch needed fields
      const subCon = await SubContractor.findById(dprData.subContractorId).select('agreedRates');
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
        liabilityIds.push(newLiability._id);
      }
    }

    // 5. Add DPR and liabilities to project
    // ⚡ BOLT OPTIMIZATION: Single atomic update to project instead of multiple .save() calls
    await Project.updateOne(
      { _id: projectId },
      {
        $push: {
          dprs: newDPR._id,
          liabilities: { $each: liabilityIds }
        }
      }
    );

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    // ⚡ BOLT OPTIMIZATION: Generic 500 error to prevent information leakage
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

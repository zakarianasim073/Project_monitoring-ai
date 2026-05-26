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

    // Use .exists() for faster validation without hydrating large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    // Will save in Promise.all

    // 2. Auto-update BOQ executed quantity (if linked)
    let boqUpdatePromise: Promise<any> = Promise.resolve();
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      // Use atomic $inc to avoid race conditions and N+1 query patterns
      boqUpdatePromise = BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ).exec();
    }

    // 3. Auto-deduct material stock (using bulkWrite for atomic stock clamping)
    let materialUpdatePromise: Promise<any> = Promise.resolve();
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
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
      materialUpdatePromise = Material.bulkWrite(materialOps);
    }

    // 4. Auto-create subcontractor liability (if linked)
    let liabilityPromise: Promise<any> = Promise.resolve();
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      liabilityPromise = (async () => {
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
          return newLiability.save();
        }
        return null;
      })();
    }

    // 5. Parallelize all independent database operations
    const [savedLiability] = await Promise.all([
      liabilityPromise,
      newDPR.save(),
      boqUpdatePromise,
      materialUpdatePromise
    ]);

    // 6. Consolidate project-linked ID updates into a single atomic update
    const projectUpdates: any = { $push: { dprs: newDPR._id } };
    if (savedLiability) {
      projectUpdates.$push.liabilities = savedLiability._id;
    }

    await Project.updateOne({ _id: projectId }, projectUpdates);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

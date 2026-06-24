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

    // OPTIMIZATION: Use .exists() for faster validation without hydrating large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Instantiate DPR (ID is generated on instantiation)
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    const promises: Promise<any>[] = [newDPR.save()];

    // 2. Auto-update BOQ executed quantity (if linked)
    // OPTIMIZATION: Use atomic $inc and scope to projectId for BOLA
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      promises.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock
    // OPTIMIZATION: Use bulkWrite with aggregation pipeline for atomic updates and clamping
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId, project: projectId },
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
      promises.push(Material.bulkWrite(materialOps));
    }

    // 4. Auto-create subcontractor liability (if linked)
    // OPTIMIZATION: Fetch only necessary fields and scope to projectId
    let newLiabilityId: any = null;
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
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

        newLiabilityId = newLiability._id;
        promises.push(newLiability.save());
      }
    }

    // Execute parallel updates
    await Promise.all(promises);

    // 5. Add DPR (and liability if created) to project in one atomic update
    // OPTIMIZATION: Consolidate multiple project saves into one updateOne
    const projectUpdate: any = { $push: { dprs: newDPR._id } };
    if (newLiabilityId) {
      projectUpdate.$push.liabilities = newLiabilityId;
    }
    await Project.updateOne({ _id: projectId }, projectUpdate);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    // Log error for server-side observability and return generic message
    console.error(`[createDPR] Error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

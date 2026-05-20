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
    await newDPR.save();

    // 2. Auto-update BOQ executed quantity (if linked)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      // Atomic update using $inc and project-scoping for BOLA protection
      await BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      );
    }

    // 3. Auto-deduct material stock using bulkWrite with aggregation pipeline for atomicity and clamping
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialUpdates = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId, project: projectId },
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
      await Material.bulkWrite(materialUpdates);
    }

    // 4. Auto-create subcontractor liability (if linked)
    let liabilityIdToLink = null;
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // BOLA protection and select only needed field
      const subCon = await SubContractor.findOne({ _id: dprData.subContractorId, project: projectId }).select('agreedRates');
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

        // Optimization: Defer project update to consolidate multiple links
        liabilityIdToLink = newLiability._id;
      }
    }

    // 5. Consolidate project linking (DPR and Liability IDs) into a single updateOne
    const updateOps: any = { $push: { dprs: newDPR._id } };
    if (liabilityIdToLink) {
      updateOps.$push.liabilities = liabilityIdToLink;
    }
    await Project.updateOne({ _id: projectId }, updateOps);

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

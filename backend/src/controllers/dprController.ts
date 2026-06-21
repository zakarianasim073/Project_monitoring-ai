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

    // OPTIMIZATION: Use .exists() to avoid hydrating large project sub-document arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    await newDPR.save();

    const projectUpdatePushes: any = { dprs: newDPR._id };

    // 2. Auto-update BOQ executed quantity (if linked)
    // OPTIMIZATION: Use atomic $inc with updateOne to avoid findById + save
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      await BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId }, // BOLA Scoping
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      );
    }

    // 3. Auto-deduct material stock
    // OPTIMIZATION: Use bulkWrite to handle multiple material updates in ONE roundtrip
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId, project: projectId }, // BOLA Scoping
          update: {
            $inc: {
              totalConsumed: Number(usage.qty),
              currentStock: -Number(usage.qty) // Material schema should ideally use min:0 or app logic ensures this
            }
          }
        }
      }));
      await Material.bulkWrite(materialOps);
    }

    // 4. Auto-create subcontractor liability (if linked)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // OPTIMIZATION: Fetch only necessary field (agreedRates) to save memory
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
        await newLiability.save();

        projectUpdatePushes.liabilities = newLiability._id;
      }
    }

    // 5. Final Project Update
    // OPTIMIZATION: Consolidate all project-level reference updates into one atomic updateOne
    await Project.updateOne(
      { _id: projectId },
      { $push: projectUpdatePushes }
    );

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    // SECURITY: Use generic error message in response to avoid leaking internal details
    console.error(`[createDPR Error]:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

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

    // OPTIMIZATION: Use .exists() to avoid hydrating massive sub-document arrays in Project model
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Prepare DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    const tasks: Promise<any>[] = [newDPR.save()];

    // 2. Auto-update BOQ executed quantity (if linked)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      // SECURITY: BOLA protection - scope BOQItem lookup to projectId
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      // OPTIMIZATION: Use bulkWrite to eliminate N+1 database roundtrips for material updates
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId, project: projectId }, // SECURITY: BOLA protection
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
      tasks.push(Material.bulkWrite(materialOps));
    }

    // 4. Auto-create subcontractor liability (if linked)
    let newLiabilityId: any = null;
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // SECURITY: BOLA protection - scope SubContractor lookup to projectId
      // OPTIMIZATION: Use projection to only fetch necessary fields
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
        tasks.push(newLiability.save());
        newLiabilityId = newLiability._id;
      }
    }

    // 5. Parallel execution of independent database operations
    await Promise.all(tasks);

    // 6. Link DPR (and Liability) to project atomically
    // OPTIMIZATION: Use updateOne with $push to avoid full document hydration and multiple .save() calls
    const projectUpdates: any = { $push: { dprs: newDPR._id } };
    if (newLiabilityId) {
      projectUpdates.$push.liabilities = newLiabilityId;
    }
    await Project.updateOne({ _id: projectId }, projectUpdates);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    // SECURITY: Prevent information leakage by standardizing on generic error message
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

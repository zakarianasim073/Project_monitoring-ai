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

    // OPTIMIZATION: Use .exists() to avoid hydrating large sub-document arrays in Project model
    // SECURITY: Validate project existence before proceeding
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Instantiate DPR (save later in Promise.all)
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    const tasks: Promise<any>[] = [newDPR.save()];

    // 2. Atomic update for BOQ executed quantity
    // SECURITY: Scope to projectId to prevent BOLA
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. OPTIMIZATION: Use bulkWrite with aggregation pipelines for atomic material updates
    // Eliminates N+1 query pattern and ensures non-negative stock levels without race conditions
    if (dprData.materialsUsed?.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId, project: projectId }, // SECURITY: Scope to projectId
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
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // SECURITY: Scope to projectId to prevent BOLA
      const subCon = await SubContractor.findOne({ _id: dprData.subContractorId, project: projectId });
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
        // OPTIMIZATION: Atomic push to Project instead of full hydration and .save()
        tasks.push(Project.updateOne({ _id: projectId }, { $push: { liabilities: newLiability._id } }));
      }
    }

    // 5. OPTIMIZATION: Atomic push to Project instead of full hydration and .save()
    tasks.push(Project.updateOne({ _id: projectId }, { $push: { dprs: newDPR._id } }));

    // OPTIMIZATION: Parallelize all non-dependent database operations
    await Promise.all(tasks);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    // SECURITY: Return generic error message to avoid information leakage
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

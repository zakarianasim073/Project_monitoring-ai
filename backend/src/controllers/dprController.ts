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

    // ⚡ Optimization: Use exists() instead of findById() to avoid hydrating large sub-document arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // Parallelize independent data fetches and initial DPR creation
    // ⚡ Optimization: Scoping lookups by projectId for IDOR prevention and index efficiency
    const [boqItem, subCon] = await Promise.all([
      dprData.linkedBoqId ? BOQItem.findOne({ _id: dprData.linkedBoqId, project: projectId }) : null,
      dprData.subContractorId ? SubContractor.findOne({ _id: dprData.subContractorId, project: projectId }) : null,
    ]);

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    const tasks: Promise<any>[] = [newDPR.save()];

    // 2. Auto-update BOQ executed quantity (if linked)
    if (boqItem && dprData.workDoneQty) {
      // ⚡ Optimization: Use updateOne with $inc for atomic update without full document hydration
      tasks.push(BOQItem.updateOne(
        { _id: boqItem._id },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      // ⚡ Optimization: Replace N+1 loop with bulkWrite and aggregation pipeline for atomic clamping at zero
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
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
      tasks.push(Material.bulkWrite(materialOps));
    }

    // 4. Auto-create subcontractor liability (if linked)
    let newLiabilityId: any = null;
    if (subCon && dprData.workDoneQty && dprData.linkedBoqId) {
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

    // ⚡ Optimization: Parallelize all database operations to reduce total request latency
    await Promise.all(tasks);

    // 5. Add DPR (and liability) to project
    // ⚡ Optimization: Use updateOne with $push to avoid fetching and saving the entire Project document
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
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export default { createDPR };

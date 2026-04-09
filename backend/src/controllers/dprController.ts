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

    // PERFORMANCE: Use .exists() to avoid full document hydration
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const tasks: Promise<any>[] = [];

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    tasks.push(newDPR.save());

    // 2. Auto-update BOQ executed quantity (if linked) - ATOMIC
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock - ATOMIC & PARALLEL
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      for (const usage of dprData.materialsUsed) {
        tasks.push(Material.updateOne(
          { _id: usage.materialId },
          [
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
        ));
      }
    }

    // 4. Auto-create subcontractor liability (if linked)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      const subCon = await SubContractor.findById(dprData.subContractorId);
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

        // We need the liability ID, so we save it and then push to project
        tasks.push(newLiability.save().then(l =>
          Project.updateOne({ _id: projectId }, { $push: { liabilities: l._id } })
        ));
      }
    }

    // 5. Add DPR to project
    tasks.push(Project.updateOne({ _id: projectId }, { $push: { dprs: newDPR._id } }));

    // Execute all tasks in parallel
    await Promise.all(tasks);

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

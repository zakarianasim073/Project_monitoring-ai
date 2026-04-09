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

    // Parallelize initial lookups to reduce latency
    const [projectExists, subCon] = await Promise.all([
      Project.exists({ _id: projectId }),
      dprData.subContractorId ? SubContractor.findById(dprData.subContractorId) : Promise.resolve(null)
    ]);

    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const promises: Promise<any>[] = [];
    const projectPush: any = {};

    // 1. Create DPR instance (generates _id locally)
    const newDPR = new DPR({ ...dprData, project: projectId });
    projectPush.dprs = newDPR._id;
    promises.push(newDPR.save());

    // 2. Atomic update for BOQ executed quantity
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      promises.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Atomic Material stock updates (Parallelized N+1 loop fix)
    if (dprData.materialsUsed?.length > 0) {
      dprData.materialsUsed.forEach((usage: any) => {
        promises.push(Material.updateOne(
          { _id: usage.materialId, project: projectId },
          [{
            $set: {
              totalConsumed: { $add: [{ $ifNull: ["$totalConsumed", 0] }, Number(usage.qty)] },
              currentStock: { $max: [0, { $subtract: [{ $ifNull: ["$currentStock", 0] }, Number(usage.qty)] }] }
            }
          }]
        ));
      });
    }

    // 4. Subcontractor liability automation
    if (subCon && dprData.workDoneQty && dprData.linkedBoqId) {
      const rateObj = subCon.agreedRates.find((r: any) => r.boqId === dprData.linkedBoqId);
      const rate = rateObj?.rate || 0;
      const liabilityAmount = Number(dprData.workDoneQty) * rate;

      const newLiability = new Liability({
        project: projectId,
        description: `Sub-contractor work: ${dprData.activity}`,
        type: 'UNBILLED_WORK',
        amount: liabilityAmount,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      });

      projectPush.liabilities = newLiability._id;
      promises.push(newLiability.save());
    }

    // 5. Consolidated Project document update
    promises.push(Project.updateOne({ _id: projectId }, { $push: projectPush }));

    // Execute all database operations in parallel
    await Promise.all(promises);

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

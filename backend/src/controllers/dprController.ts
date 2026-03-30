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

    // Use .exists() for a lightweight project check
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Prepare DPR document
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    const tasks: Promise<any>[] = [newDPR.save()];

    // 2. Atomic update for BOQ executed quantity
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Batch atomic update for material stock using bulkWrite
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId },
          update: {
            $inc: {
              totalConsumed: Number(usage.qty),
              currentStock: -Number(usage.qty)
            }
          }
        }
      }));
      tasks.push(Material.bulkWrite(materialOps));
    }

    // 4. Subcontractor liability logic
    let newLiabilityId: any = null;
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // Use .lean() to skip document hydration for read-only lookup
      const subCon = await SubContractor.findById(dprData.subContractorId).lean();
      if (subCon) {
        const rateObj = subCon.agreedRates.find((r: any) => r.boqId === dprData.linkedBoqId);
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
        tasks.push(newLiability.save());
      }
    }

    // 5. Atomic update to link DPR and Liability to project in one go
    const projectUpdates: any = { $push: { dprs: newDPR._id } };
    if (newLiabilityId) {
      projectUpdates.$push.liabilities = newLiabilityId;
    }

    tasks.push(Project.updateOne({ _id: projectId }, projectUpdates));

    // Parallel execution of all independent database tasks
    await Promise.all(tasks);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default { createDPR };

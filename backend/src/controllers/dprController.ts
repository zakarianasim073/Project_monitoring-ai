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

    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // BOLT OPTIMIZATION: Group independent database operations into Promise.all
    // to reduce total response time by executing them concurrently.
    // Estimated reduction in roundtrip overhead: (N+M+5) -> 3-4 roundtrips
    const tasks: Promise<any>[] = [newDPR.save()];

    // 2. Auto-update BOQ executed quantity (if linked)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId },
          update: [{
            $set: {
              totalConsumed: { $add: [{ $ifNull: ["$totalConsumed", 0] }, Number(usage.qty)] },
              currentStock: {
                $max: [0, { $subtract: [{ $ifNull: ["$currentStock", 0] }, Number(usage.qty)] }]
              }
            }
          }]
        }
      }));
      tasks.push(Material.bulkWrite(materialOps));
    }

    // BOLT OPTIMIZATION: Fetch subcontractor agreedRates in parallel
    let subConPromise: Promise<any> | null = null;
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      subConPromise = SubContractor.findById(dprData.subContractorId).select('agreedRates');
      tasks.push(subConPromise);
    }

    await Promise.all(tasks);

    // 4. Auto-create subcontractor liability (if linked)
    const projectPush: any = { dprs: newDPR._id };

    if (subConPromise) {
      const subCon = await subConPromise;
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
        await newLiability.save();
        projectPush.liabilities = newLiability._id;
      }
    }

    // 5. Add DPR (and liability if created) to project
    // BOLT OPTIMIZATION: Combine project updates into a single atomic push
    await Project.updateOne({ _id: projectId }, { $push: projectPush });

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

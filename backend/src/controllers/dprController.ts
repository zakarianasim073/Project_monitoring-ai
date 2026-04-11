import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { DPR } from '../models/DPR';
import { BOQItem } from '../models/BOQItem';
import { Material } from '../models/Material';
import { Liability } from '../models/Liability';
import { SubContractor } from '../models/SubContractor';

// Create DPR with full automation - Performance Optimized
export const createDPR = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const dprData = req.body;

    // Use exists() for faster check than findById()
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create and save DPR first to get its ID
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    await newDPR.save();

    const tasks: Promise<any>[] = [];
    let liabilityId: any = null;

    // 2. Auto-update BOQ executed quantity (if linked) using atomic $inc
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock using bulkWrite and atomic $inc for performance
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

    // 4. Auto-create subcontractor liability (if linked)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      const liabilityTask = (async () => {
        // Use lean() for read-only query
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
          await newLiability.save();
          liabilityId = newLiability._id;
        }
      })();
      tasks.push(liabilityTask);
    }

    // Run independent database operations in parallel
    await Promise.all(tasks);

    // 5. Add DPR and Liability (if any) to project in a single atomic update
    const projectUpdate: any = { $push: { dprs: newDPR._id } };
    if (liabilityId) {
      projectUpdate.$push.liabilities = liabilityId;
    }

    await Project.updateOne({ _id: projectId }, projectUpdate);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" }); // Avoid leaking error details
  }
};

export default { createDPR };

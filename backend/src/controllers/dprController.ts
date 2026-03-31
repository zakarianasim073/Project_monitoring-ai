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

    // Use .exists() to minimize hydration overhead
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR document
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    const dbOps: Promise<any>[] = [];

    // 2. Parallelize initial saves and independent updates
    dbOps.push(newDPR.save());

    // 3. Batch material stock updates using bulkWrite with atomic $inc
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialUpdates = dprData.materialsUsed.map((usage: any) => ({
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
      dbOps.push(Material.bulkWrite(materialUpdates));
    }

    // 4. Update BOQ executed quantity (atomically)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      dbOps.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 5. Handle Subcontractor Liability
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // Still need to find subcontractor for the rate
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

        // Parallelize liability save and project update (ID is available before save)
        dbOps.push(newLiability.save());
        dbOps.push(Project.updateOne(
          { _id: projectId },
          { $push: { dprs: newDPR._id, liabilities: newLiability._id } }
        ));
      } else {
        // Just push DPR if no liability
        dbOps.push(Project.updateOne(
          { _id: projectId },
          { $push: { dprs: newDPR._id } }
        ));
      }
    } else {
      // Just push DPR if no liability condition met
      dbOps.push(Project.updateOne(
        { _id: projectId },
        { $push: { dprs: newDPR._id } }
      ));
    }

    // Execute all pending operations in parallel
    await Promise.all(dbOps);

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

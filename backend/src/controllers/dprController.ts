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

    // Use .exists() to avoid hydrating large project sub-document arrays (performance)
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    await newDPR.save();

    const updatePromises: Promise<any>[] = [];
    const liabilityIds: string[] = [];

    // 2. Auto-update BOQ executed quantity (if linked) - Atomic update with BOLA protection
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      updatePromises.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock - Bulk write to eliminate N+1 queries
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId, project: projectId },
          update: {
            $inc: {
              totalConsumed: Number(usage.qty),
              currentStock: -Number(usage.qty)
            }
          }
        }
      }));
      updatePromises.push(Material.bulkWrite(materialOps));
    }

    // 4. Auto-create subcontractor liability (if linked)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // Use projection to fetch only necessary data (memory efficiency) and enforce BOLA
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
        liabilityIds.push(newLiability._id.toString());
      }
    }

    // Execute all non-dependent updates in parallel
    await Promise.all(updatePromises);

    // 5. Atomic update to project for DPR and Liabilities (minimizes database roundtrips)
    const pushData: any = { dprs: newDPR._id };
    if (liabilityIds.length > 0) {
      pushData.liabilities = { $each: liabilityIds };
    }

    await Project.updateOne({ _id: projectId }, { $push: pushData });

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    // Return generic error to prevent sensitive info leakage
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

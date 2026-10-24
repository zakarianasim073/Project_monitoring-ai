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

    // Use .exists() to avoid full document hydration of the Project document (and its large arrays)
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    await newDPR.save();

    const updatePromises: Promise<any>[] = [];

    // 2. Auto-update BOQ executed quantity (if linked) - Atomic update with BOLA protection
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      updatePromises.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock - Atomic bulk update to eliminate N+1 loop and save() calls
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const bulkOps = dprData.materialsUsed.map((usage: any) => ({
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
      updatePromises.push(Material.bulkWrite(bulkOps));
    }

    const liabilityIds: any[] = [];
    // 4. Auto-create subcontractor liability (if linked) - Scoped lookup with projection for performance and BOLA
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
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
        liabilityIds.push(newLiability._id);
      }
    }

    // 5. Atomic update to Project to link DPR and Liability (if any) in one roundtrip
    const projectUpdate: any = { $push: { dprs: newDPR._id } };
    if (liabilityIds.length > 0) {
      projectUpdate.$push.liabilities = { $each: liabilityIds };
    }
    updatePromises.push(Project.updateOne({ _id: projectId }, projectUpdate));

    // Execute all non-dependent side-effect updates in parallel
    await Promise.all(updatePromises);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    // Return generic error message to prevent sensitive information leakage
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

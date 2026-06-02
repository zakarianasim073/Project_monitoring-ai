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

    // OPTIMIZATION: Use .exists() to avoid hydrating large sub-resource arrays (boq, bills, dprs, etc.)
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // 2 & 4. Parallelize side-effects (BOQ, Materials, Liability) and save DPR
    const sideEffects: Promise<any>[] = [newDPR.save()];

    // Auto-update BOQ executed quantity (if linked)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      sideEffects.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // OPTIMIZATION: Use bulkWrite for Materials to eliminate N+1 loop and save() calls
    if (dprData.materialsUsed?.length > 0) {
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
      sideEffects.push(Material.bulkWrite(materialOps));
    }

    // Auto-create subcontractor liability (if linked)
    let liabilityId: any = null;
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // We need SubContractor rate first - parallelized with saving DPR and other updates
      const subConPromise = (async () => {
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
          await newLiability.save();
          liabilityId = newLiability._id;
          return liabilityId;
        }
      })();
      sideEffects.push(subConPromise);
    }

    // Execute all updates in parallel
    await Promise.all(sideEffects);

    // 5. Atomic update to link DPR and Liability to project (avoids full document .save())
    const projectUpdates: any = { $push: { dprs: newDPR._id } };
    if (liabilityId) projectUpdates.$push.liabilities = liabilityId;

    await Project.updateOne({ _id: projectId }, projectUpdates);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR,
      // Include data for backward compatibility if needed
      data: newDPR
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export default { createDPR };

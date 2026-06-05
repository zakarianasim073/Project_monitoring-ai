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

    // OPTIMIZATION: Use .exists() to avoid hydrating large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Prepare DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // 2. Execute independent operations in parallel
    const tasks: Promise<any>[] = [newDPR.save()];

    // Auto-update BOQ executed quantity (if linked)
    // OPTIMIZATION: Use updateOne with BOLA check and avoid hydration
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // Auto-deduct material stock
    // OPTIMIZATION: Use bulkWrite with aggregation pipeline to update all materials in one roundtrip
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
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

    // Prepare SubContractor lookup for Liability creation
    let subConPromise: Promise<any> | null = null;
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // BOLA Scoping: Ensure subcontractor belongs to project
      subConPromise = SubContractor.findOne({ _id: dprData.subContractorId, project: projectId });
      tasks.push(subConPromise);
    }

    await Promise.all(tasks);

    // 3. Handle Liability creation and Project linkage
    const projectUpdates: any = { $push: { dprs: newDPR._id } };

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
        projectUpdates.$push.liabilities = newLiability._id;
      }
    }

    // OPTIMIZATION: Single atomic update to Project instead of multiple .save() calls
    await Project.updateOne({ _id: projectId }, projectUpdates);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR,
      // Supporting legacy frontend structures that might expect 'data'
      data: newDPR
    });

  } catch (error: any) {
    console.error(error);
    // Generic error message for security hardening
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

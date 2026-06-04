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

    // Use .exists() for faster validation without hydrating large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    const tasks: Promise<any>[] = [newDPR.save()];

    // 2. Auto-update BOQ executed quantity (if linked) - BOLA scoped
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock - Atomic bulk update with stock capping
    if (dprData.materialsUsed?.length > 0) {
      const ops = dprData.materialsUsed.map((usage: any) => ({
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
      tasks.push(Material.bulkWrite(ops));
    }

    let createdLiabilityId: any = null;
    // 4. Auto-create subcontractor liability (if linked) - BOLA scoped
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      tasks.push((async () => {
        const subCon = await SubContractor.findOne({ _id: dprData.subContractorId, project: projectId });
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
          createdLiabilityId = newLiability._id;
        }
      })());
    }

    // Execute all side-effects in parallel to minimize latency
    await Promise.all(tasks);

    // 5. Atomic link to project (avoids N+1 saves and hydration overhead)
    const projectUpdates: any = { $push: { dprs: newDPR._id } };
    if (createdLiabilityId) {
      projectUpdates.$push.liabilities = createdLiabilityId;
    }
    await Project.updateOne({ _id: projectId }, projectUpdates);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR,
      data: newDPR // Maintain backward compatibility
    });

  } catch (error: any) {
    console.error(error);
    // Generic error response to prevent information leakage
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

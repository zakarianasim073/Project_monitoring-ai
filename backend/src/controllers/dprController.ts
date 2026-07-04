import { Request, Response } from 'express';
import mongoose from 'mongoose';
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

    // Parallelize dependency checks
    // BOLA check: Ensure sub-resources belong to the authorized project
    const [projectExists, subCon] = await Promise.all([
      Project.exists({ _id: projectId }),
      dprData.subContractorId ? SubContractor.findOne({ _id: dprData.subContractorId, project: projectId }).select('agreedRates') : Promise.resolve(null)
    ]);

    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const newDPRId = new mongoose.Types.ObjectId();
    const ops: Promise<any>[] = [];
    const projectUpdates: any = { $push: { dprs: newDPRId } };

    // 1. Prepare DPR
    const newDPR = new DPR({
      ...dprData,
      _id: newDPRId,
      project: projectId,
    });
    ops.push(newDPR.save());

    // 2. Auto-update BOQ executed quantity (if linked)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      ops.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock with bulkWrite for efficiency
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId, project: projectId },
          update: [
            {
              $set: {
                totalConsumed: { $add: [{ $ifNull: ["$totalConsumed", 0] }, Number(usage.qty)] },
                currentStock: { $max: [0, { $subtract: [{ $ifNull: ["$currentStock", 0] }, Number(usage.qty)] }] }
              }
            }
          ]
        }
      }));
      ops.push(Material.bulkWrite(materialOps));
    }

    // 4. Auto-create subcontractor liability (if linked)
    if (subCon && dprData.workDoneQty && dprData.linkedBoqId) {
      const rateObj = subCon.agreedRates.find((r: any) => r.boqId === dprData.linkedBoqId);
      const rate = rateObj ? (rateObj.rate || 0) : 0;
      const liabilityAmount = Number(dprData.workDoneQty) * rate;

      const newLiabilityId = new mongoose.Types.ObjectId();
      const newLiability = new Liability({
        _id: newLiabilityId,
        project: projectId,
        description: `Sub-contractor work: ${dprData.activity}`,
        type: 'UNBILLED_WORK',
        amount: liabilityAmount,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      });
      ops.push(newLiability.save());
      projectUpdates.$push.liabilities = newLiabilityId;
    }

    // 5. Atomic project update to avoid hydrating large sub-document arrays
    ops.push(Project.updateOne({ _id: projectId }, projectUpdates));

    await Promise.all(ops);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    const { projectId } = req.params;
    console.error(`Error creating DPR for project ${projectId}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default { createDPR };

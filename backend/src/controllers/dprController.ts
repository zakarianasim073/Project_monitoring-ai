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

    // 1. Create DPR & Parallel Lookups
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // OPTIMIZATION: Start independent lookups and save in parallel
    const [boqItem, subCon] = await Promise.all([
      dprData.linkedBoqId ? BOQItem.findById(dprData.linkedBoqId) : Promise.resolve(null),
      dprData.subContractorId ? SubContractor.findById(dprData.subContractorId) : Promise.resolve(null),
      newDPR.save()
    ]);

    // 2. Auto-update BOQ executed quantity (if linked)
    if (boqItem && dprData.workDoneQty) {
      boqItem.executedQty += Number(dprData.workDoneQty);
      await boqItem.save();
    }

    // 3. Auto-deduct material stock
    // OPTIMIZATION: Use bulkWrite to eliminate N+1 loop and save() calls
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialUpdates = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId },
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
      await Material.bulkWrite(materialUpdates);
    }

    // 4. Auto-create subcontractor liability (if linked)
    let newLiabilityId = null;
    if (subCon && dprData.workDoneQty && dprData.linkedBoqId) {
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
      newLiabilityId = newLiability._id;
    }

    // 5. Add DPR to project (and Liability if created)
    const projectUpdate: any = { $push: { dprs: newDPR._id } };
    if (newLiabilityId) {
      projectUpdate.$push.liabilities = newLiabilityId;
    }
    await Project.updateOne({ _id: projectId }, projectUpdate);

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

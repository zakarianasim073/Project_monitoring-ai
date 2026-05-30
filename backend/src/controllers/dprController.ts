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

    // Use .exists() to avoid hydrating large sub-document arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    await newDPR.save();

    // Parallelize independent automated updates to reduce latency
    const [_, __, newLiabilityId] = await Promise.all([
      // 2. Atomic update to BOQ executed quantity (if linked)
      dprData.linkedBoqId && dprData.workDoneQty
        ? BOQItem.updateOne(
            { _id: dprData.linkedBoqId, project: projectId },
            { $inc: { executedQty: Number(dprData.workDoneQty) } }
          )
        : Promise.resolve(null),

      // 3. Atomic material stock update using bulkWrite
      dprData.materialsUsed && dprData.materialsUsed.length > 0
        ? Material.bulkWrite(
            dprData.materialsUsed.map((usage: any) => ({
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
            }))
          )
        : Promise.resolve(null),

      // 4. Auto-create subcontractor liability (if linked)
      (async () => {
        if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
          const subCon = await SubContractor.findOne({ _id: dprData.subContractorId, project: projectId });
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
            return newLiability._id;
          }
        }
        return null;
      })()
    ]);

    // 5. Atomic project resource linking
    const projectLinks: any = { dprs: newDPR._id };
    if (newLiabilityId) projectLinks.liabilities = newLiabilityId;

    await Project.updateOne(
      { _id: projectId },
      { $push: projectLinks }
    );

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

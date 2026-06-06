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

    // PERFORMANCE: Use .exists() for faster validation without hydrating large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // Start parallel processing for independent operations
    const operations: Promise<any>[] = [
      newDPR.save(),
      // 5. Link DPR to project immediately (atomic)
      Project.updateOne({ _id: projectId }, { $push: { dprs: newDPR._id } })
    ];

    // 2. Auto-update BOQ executed quantity (if linked)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      operations.push(
        BOQItem.updateOne(
          { _id: dprData.linkedBoqId },
          { $inc: { executedQty: Number(dprData.workDoneQty) } }
        )
      );
    }

    // 3. Auto-deduct material stock
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      // OPTIMIZATION: Use bulkWrite with aggregation pipeline to update multiple materials in ONE roundtrip
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
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
      operations.push(Material.bulkWrite(materialOps));
    }

    // 4. Auto-create subcontractor liability (if linked)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // We need SubContractor rate first, but we can do it inside the parallel flow
      const subConOp = async () => {
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

          // Link liability to project atomically
          await Project.updateOne({ _id: projectId }, { $push: { liabilities: newLiability._id } });
        }
      };
      operations.push(subConOp());
    }

    // Execute all operations in parallel
    // This reduces the sequential database roundtrips from ~14 (for 3 materials) down to 3 or 4
    await Promise.all(operations);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR,
      data: newDPR // Maintain backward compatibility
    });

  } catch (error: any) {
    console.error(error);
    // Information Leakage prevention: Use generic 500 while logging internally
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Project } from '../models/Project';
import { DPR } from '../models/DPR';
import { BOQItem } from '../models/BOQItem';
import { Material } from '../models/Material';
import { Liability } from '../models/Liability';
import { SubContractor } from '../models/SubContractor';

/**
 * Optimized DPR creation with full automation.
 * Reduces database roundtrips from ~ (N + M + 5) to 3-4 by parallelizing tasks
 * and using atomic bulk operations for material stock management.
 */
export const createDPR = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const dprData = req.body;

    // 1. Parallelize initial validation and dependency fetching
    const [projectExists, subCon, boqExists] = await Promise.all([
      Project.exists({ _id: projectId }),
      dprData.subContractorId
        ? SubContractor.findById(dprData.subContractorId).select('agreedRates')
        : Promise.resolve(null),
      dprData.linkedBoqId
        ? BOQItem.exists({ _id: dprData.linkedBoqId })
        : Promise.resolve(null)
    ]);

    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const writePromises: Promise<any>[] = [];

    // 2. Prepare DPR
    const dprId = new mongoose.Types.ObjectId();
    const newDPR = new DPR({
      ...dprData,
      _id: dprId,
      project: projectId,
    });
    writePromises.push(newDPR.save());

    // 3. Prepare BOQ Update (Atomic $inc)
    if (boqExists && dprData.workDoneQty) {
      writePromises.push(
        BOQItem.updateOne(
          { _id: dprData.linkedBoqId },
          { $inc: { executedQty: Number(dprData.workDoneQty) } }
        )
      );
    }

    // 4. Prepare Material Updates (Atomic BulkWrite with aggregation pipeline for clamping)
    if (dprData.materialsUsed?.length > 0) {
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
      writePromises.push(Material.bulkWrite(materialOps));
    }

    // 5. Prepare Subcontractor Liability
    let liabilityId: mongoose.Types.ObjectId | null = null;
    if (subCon && dprData.workDoneQty && dprData.linkedBoqId) {
      const rateObj = subCon.agreedRates.find(r => r.boqId === dprData.linkedBoqId);
      const rate = rateObj?.rate || 0;
      const liabilityAmount = Number(dprData.workDoneQty) * rate;

      liabilityId = new mongoose.Types.ObjectId();
      const newLiability = new Liability({
        _id: liabilityId,
        project: projectId,
        description: `Sub-contractor work: ${dprData.activity}`,
        type: 'UNBILLED_WORK',
        amount: liabilityAmount,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      });

      writePromises.push(newLiability.save());
    }

    // 6. Execute all writes in parallel, including the consolidated Project update
    writePromises.push(
      Project.updateOne(
        { _id: projectId },
        {
          $push: {
            dprs: dprId,
            ...(liabilityId ? { liabilities: liabilityId } : {})
          }
        }
      )
    );

    await Promise.all(writePromises);

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

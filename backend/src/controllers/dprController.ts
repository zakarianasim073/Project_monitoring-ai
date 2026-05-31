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

    // PERFORMANCE: Parallelize existence check and subcontractor lookup
    // Optimization: Use Project.exists() to avoid hydrating large sub-document arrays
    const [projectExists, subCon] = await Promise.all([
      Project.exists({ _id: projectId }),
      dprData.subContractorId ? SubContractor.findById(dprData.subContractorId) : Promise.resolve(null)
    ]);

    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // sideEffects tracks all independent DB operations to be executed in parallel
    const sideEffects: Promise<any>[] = [newDPR.save()];

    // 2. Auto-update BOQ executed quantity (if linked)
    // Optimization: Use updateOne with $inc to avoid findById + save hydration/roundtrip
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      sideEffects.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock
    // Optimization: Use Material.bulkWrite with an aggregation pipeline to update all materials in ONE roundtrip
    // Uses $max to atomically clamp currentStock at 0
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId },
          update: [{
            $set: {
              totalConsumed: { $add: [{ $ifNull: ["$totalConsumed", 0] }, Number(usage.qty)] },
              currentStock: {
                $max: [0, { $subtract: [{ $ifNull: ["$currentStock", 0] }, Number(usage.qty)] }]
              }
            }
          }]
        }
      }));
      sideEffects.push(Material.bulkWrite(materialOps));
    }

    // 4. Auto-create subcontractor liability (if linked)
    let liabilityId: any = null;
    if (subCon && dprData.workDoneQty && dprData.linkedBoqId) {
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
      sideEffects.push(newLiability.save());
      liabilityId = newLiability._id;
    }

    // Execute all side effects in parallel to minimize latency
    await Promise.all(sideEffects);

    // 5. Final atomic update to Project to link new resources
    // Optimization: Consolidate DPR and Liability linking into a single updateOne
    await Project.updateOne(
      { _id: projectId },
      {
        $push: {
          dprs: newDPR._id,
          ...(liabilityId && { liabilities: liabilityId })
        }
      }
    );

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    // Standardize error response to prevent Information Leakage (Sentinel hardening)
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

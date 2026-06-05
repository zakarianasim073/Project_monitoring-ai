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

    // OPTIMIZATION: Use .exists() to avoid hydrating large sub-document arrays (boq, dprs, materials, etc.)
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // Initialize the DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // 1. Prepare parallel operations to maximize I/O throughput
    const operations: Promise<any>[] = [
      newDPR.save() // Save the DPR itself
    ];

    // 2. Auto-update BOQ executed quantity (if linked) - Scoped to project for BOLA prevention
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      operations.push(
        BOQItem.updateOne(
          { _id: dprData.linkedBoqId, project: projectId },
          { $inc: { executedQty: Number(dprData.workDoneQty) } }
        )
      );
    }

    // 3. OPTIMIZATION: Use bulkWrite with aggregation pipeline to atomically update multiple materials
    // and eliminate N+1 query overhead. This ensures stock never goes below zero in a single roundtrip.
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialUpdates = dprData.materialsUsed.map((usage: any) => ({
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
      operations.push(Material.bulkWrite(materialUpdates));
    }

    // 4. Auto-create subcontractor liability (if linked)
    let pendingLiabilityId: any = null;
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // We wrap the SubContractor lookup and Liability creation in an async block to keep it parallel with other ops
      const subconOp = (async () => {
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
          pendingLiabilityId = newLiability._id;
          return newLiability._id;
        }
      })();
      operations.push(subconOp);
    }

    // Execute all side-effects in parallel
    await Promise.all(operations);

    // 5. Consolidate Project linking updates into a single atomic operation
    const projectUpdates: any = { $push: { dprs: newDPR._id } };
    if (pendingLiabilityId) {
      projectUpdates.$push.liabilities = pendingLiabilityId;
    }

    await Project.updateOne({ _id: projectId }, projectUpdates);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR,
      data: newDPR // Maintain backward compatibility
    });

  } catch (error: any) {
    console.error('Error creating DPR:', error);
    // OPTIMIZATION: Generic error message to prevent Information Leakage (CWE-209)
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

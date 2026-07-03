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

    // PERFORMANCE: Use .exists() to avoid hydrating large root aggregate (Project)
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const dprId = new mongoose.Types.ObjectId();
    const promises: Promise<any>[] = [];

    // 1. Prepare DPR
    const newDPR = new DPR({
      ...dprData,
      _id: dprId,
      project: projectId,
    });
    promises.push(newDPR.save());

    // 2. Prepare BOQ update
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      promises.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Prepare Material updates (Atomic BulkWrite)
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId },
          update: [{
            $set: {
              totalConsumed: { $add: [{ $ifNull: ['$totalConsumed', 0] }, Number(usage.qty)] },
              currentStock: { $max: [0, { $subtract: [{ $ifNull: ['$currentStock', 0] }, Number(usage.qty)] }] }
            }
          }]
        }
      }));
      promises.push(Material.bulkWrite(materialOps));
    }

    // 4. Prepare Subcontractor Liability
    let liabilityId: mongoose.Types.ObjectId | null = null;
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // PERFORMANCE: Select only required fields to minimize hydration
      const subCon = await SubContractor.findById(dprData.subContractorId).select('agreedRates');
      if (subCon) {
        const rateObj = subCon.agreedRates.find(r => r.boqId === dprData.linkedBoqId);
        const rate = rateObj ? (rateObj.rate || 0) : 0;
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
        promises.push(newLiability.save());
      }
    }

    // 5. Update Project atomically
    const projectUpdate: any = {
      $push: {
        dprs: dprId,
        ...(liabilityId && { liabilities: liabilityId })
      }
    };
    promises.push(Project.updateOne({ _id: projectId }, projectUpdate));

    // PERFORMANCE: Execute all database operations in parallel
    await Promise.all(promises);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    // SECURITY: Use generic error message
    console.error('Error creating DPR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

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

    // Optimization: Use exists() instead of findById() to avoid hydrating the full Project document (which has many large arrays)
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    await newDPR.save();

    const liabilityIds: any[] = [];
    const updatePromises: Promise<any>[] = [];

    // 2. Auto-update BOQ executed quantity (if linked)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      // Optimization: Use updateOne with $inc for atomic update and to avoid find-and-save overhead
      updatePromises.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      // Optimization: Use bulkWrite with an aggregation pipeline to atomically update stock and clamp to 0 in a single roundtrip
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId },
          update: [
            {
              $set: {
                totalConsumed: { $add: [{ $ifNull: ['$totalConsumed', 0] }, Number(usage.qty)] },
                currentStock: {
                  $max: [0, { $subtract: [{ $ifNull: ['$currentStock', 0] }, Number(usage.qty)] }]
                }
              }
            }
          ]
        }
      }));
      updatePromises.push(Material.bulkWrite(materialOps));
    }

    // 4. Auto-create subcontractor liability (if linked)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // Optimization: Select only the required field to minimize data transfer
      const subCon = await SubContractor.findById(dprData.subContractorId).select('agreedRates');
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
        liabilityIds.push(newLiability._id);
      }
    }

    // 5. Consolidate project updates into a single updateOne call to minimize roundtrips and avoid document hydration
    updatePromises.push(Project.updateOne(
      { _id: projectId },
      {
        $push: {
          dprs: newDPR._id,
          liabilities: { $each: liabilityIds }
        }
      }
    ));

    await Promise.all(updatePromises);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    // Optimization: Log actual error and return generic message to prevent information leakage
    console.error('Error in createDPR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

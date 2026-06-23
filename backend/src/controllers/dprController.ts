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

    // 1. Instantiate DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    const promises: Promise<any>[] = [newDPR.save()];
    const projectPushUpdates: any = { dprs: newDPR._id };

    // 2. Auto-update BOQ executed quantity (if linked)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      // Atomic update with BOLA protection
      promises.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock using bulkWrite to eliminate N+1 loop
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const bulkOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId, project: projectId },
          update: {
            $inc: {
              totalConsumed: Number(usage.qty),
              currentStock: -Number(usage.qty)
            }
          }
        }
      }));
      promises.push(Material.bulkWrite(bulkOps));
    }

    // 4. Auto-create subcontractor liability (if linked)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // Use projection to fetch only necessary data
      const subCon = await SubContractor.findOne(
        { _id: dprData.subContractorId, project: projectId },
        { agreedRates: 1 }
      );

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

        promises.push(newLiability.save());
        projectPushUpdates.liabilities = newLiability._id;
      }
    }

    // 5. Add DPR and Liability to project in a single atomic update
    promises.push(Project.updateOne(
      { _id: projectId },
      { $push: projectPushUpdates }
    ));

    // Execute all independent operations in parallel
    await Promise.all(promises);

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    // Generic 'Internal server error' to avoid leaking stack traces
    console.error('Error in createDPR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

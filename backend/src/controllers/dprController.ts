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

    // Use .exists() to avoid hydrating large project document arrays
    // and parallelize subcontractor lookup to reduce latency
    const [projectExists, subCon] = await Promise.all([
      Project.exists({ _id: projectId }),
      dprData.subContractorId ? SubContractor.findOne({ _id: dprData.subContractorId, project: projectId }, { agreedRates: 1 }) : null
    ]);

    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const promises: Promise<any>[] = [];

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });
    promises.push(newDPR.save());

    // 2. Atomic update for BOQ executed quantity (BOLA secured)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      promises.push(BOQItem.findOneAndUpdate(
        { _id: dprData.linkedBoqId, project: projectId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Batch material stock updates using bulkWrite (Eliminates N+1 query bottleneck)
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
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
      promises.push(Material.bulkWrite(materialOps));
    }

    // 4. Auto-create subcontractor liability
    let newLiabilityId: any = null;
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

      // Save liability and capture ID for project link
      promises.push(newLiability.save().then(l => { newLiabilityId = l._id; }));
    }

    // Wait for all automation tasks to complete in parallel
    await Promise.all(promises);

    // 5. Single atomic update to link DPR and Liability to project (Avoids multiple project saves)
    const projectPush: any = { dprs: newDPR._id };
    if (newLiabilityId) {
      projectPush.liabilities = newLiabilityId;
    }

    await Project.updateOne(
      { _id: projectId },
      { $push: projectPush }
    );

    res.status(201).json({
      success: true,
      message: "DPR created with full automation",
      dpr: newDPR
    });

  } catch (error: any) {
    console.error(error);
    // Standard generic error to prevent information leakage
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { createDPR };

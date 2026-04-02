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

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // 1. Instantiate DPR (generates ID locally)
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    // ⚡ Bolt: Use Promise.all to parallelize independent database operations.
    const tasks: Promise<any>[] = [
      newDPR.save(),
      Project.updateOne({ _id: projectId }, { $push: { dprs: newDPR._id } })
    ];

    // 2. Auto-update BOQ executed quantity (if linked)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      // ⚡ Bolt: Use atomic $inc update instead of findById + save.
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      // ⚡ Bolt: Use bulkWrite to update multiple materials in a single database round-trip.
      const materialOps = dprData.materialsUsed.map((usage: any) => ({
        updateOne: {
          filter: { _id: usage.materialId },
          update: {
            $inc: {
              totalConsumed: Number(usage.qty),
              currentStock: -Number(usage.qty)
            }
          }
        }
      }));
      tasks.push(Material.bulkWrite(materialOps));
    }

    // 4. Auto-create subcontractor liability (if linked)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      // This part requires data from SubContractor, so we might need to fetch it first or handle it differently.
      // Fetching first to keep logic simple, but we parallelize the result creation.
      const subCon = await SubContractor.findById(dprData.subContractorId).lean();
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

        tasks.push(
          newLiability.save(),
          Project.updateOne({ _id: projectId }, { $push: { liabilities: newLiability._id } })
        );
      }
    }

    // Wait for all automated tasks to complete
    await Promise.all(tasks);

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

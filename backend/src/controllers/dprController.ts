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

    // Bolt: Use .exists() to skip document hydration during validation
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    const tasks: Promise<any>[] = [newDPR.save()];

    // 2. Auto-update BOQ executed quantity (if linked)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      tasks.push(BOQItem.updateOne(
        { _id: dprData.linkedBoqId },
        { $inc: { executedQty: Number(dprData.workDoneQty) } }
      ));
    }

    // 3. Auto-deduct material stock (Optimized: Parallel execution)
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
      tasks.push((async () => {
        for (const usage of dprData.materialsUsed) {
          const material = await Material.findById(usage.materialId);
          if (material) {
            material.totalConsumed = (material.totalConsumed || 0) + Number(usage.qty);
            // Bolt: Preserving stock clamping logic (preventing negative values)
            material.currentStock = Math.max(0, (material.currentStock || 0) - Number(usage.qty));
            await material.save();
          }
        }
      })());
    }

    // 4. Auto-create subcontractor liability (if linked)
    if (dprData.subContractorId && dprData.workDoneQty && dprData.linkedBoqId) {
      tasks.push((async () => {
        // Optimized: Find sub-contractor without full project hydration
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

          // Bolt: Use updateOne for linking liability to project
          await Project.updateOne(
            { _id: projectId },
            { $push: { liabilities: newLiability._id } }
          );
        }
      })());
    }

    // 5. Add DPR to project (Optimized: Concurrent with other operations)
    tasks.push(Project.updateOne(
      { _id: projectId },
      { $push: { dprs: newDPR._id } }
    ));

    // Parallelize all independent database writes to minimize overall request latency
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

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

    // Parallelize initial lookups to reduce latency. Use .lean() for read-only SubContractor.
    const [project, subCon] = await Promise.all([
      Project.findById(projectId),
      dprData.subContractorId ? SubContractor.findById(dprData.subContractorId).lean() : Promise.resolve(null)
    ]);

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // 1. Create DPR instance (id is generated locally)
    const newDPR = new DPR({
      ...dprData,
      project: projectId,
    });

    const writeOperations: Promise<any>[] = [newDPR.save()];

    // 2. Auto-update BOQ executed quantity (if linked)
    if (dprData.linkedBoqId && dprData.workDoneQty) {
      writeOperations.push(
        BOQItem.updateOne(
          { _id: dprData.linkedBoqId },
          { $inc: { executedQty: Number(dprData.workDoneQty) } }
        )
      );
    }

    // 3. Auto-deduct material stock using bulkWrite for efficiency.
    if (dprData.materialsUsed && dprData.materialsUsed.length > 0) {
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
      writeOperations.push(Material.bulkWrite(materialOps));
    }

    // 4. Auto-create subcontractor liability (if linked)
    if (subCon && dprData.workDoneQty && dprData.linkedBoqId) {
      const rateObj = subCon.agreedRates.find((r: any) => r.boqId === dprData.linkedBoqId);
      const rate = rateObj ? (rateObj.rate || 0) : 0;
      const liabilityAmount = Number(dprData.workDoneQty) * rate;

      const newLiability = new Liability({
        project: projectId,
        description: `Sub-contractor work: ${dprData.activity}`,
        type: 'UNBILLED_WORK',
        amount: liabilityAmount,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      });
      writeOperations.push(newLiability.save());
      project.liabilities.push(newLiability._id);
    }

    // 5. Update Project and parallelize all writes
    project.dprs.push(newDPR._id);
    writeOperations.push(project.save());

    await Promise.all(writeOperations);

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

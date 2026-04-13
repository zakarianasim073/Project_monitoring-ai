import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Bill } from '../models/Bill';
import { BOQItem } from '../models/BOQItem';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const billData = req.body;

    // BOLT OPTIMIZATION: Use exists() to skip hydration overhead for existence check
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const newBill = new Bill({
      ...billData,
      project: projectId,
    });

    // BOLT OPTIMIZATION: Parallelize independent database writes
    await Promise.all([
      newBill.save(),
      Project.updateOne({ _id: projectId }, { $push: { bills: newBill._id } })
    ]);

    /**
     * BOLT OPTIMIZATION: Atomic BOQ distribution
     * Why: Replaces sequential find-and-save loop (N+1) with an atomic updateMany.
     * Impact: Reduces database roundtrips from N+1 to 2 (count + updateMany).
     */
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      const activeCount = await BOQItem.countDocuments({ project: projectId, executedQty: { $gt: 0 } });
      
      if (activeCount > 0) {
        const amountPerItem = billData.amount / activeCount;
        await BOQItem.updateMany(
          { project: projectId, executedQty: { $gt: 0 } },
          { $inc: { billedAmount: amountPerItem } }
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Bill created successfully",
      bill: newBill
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { createBill };

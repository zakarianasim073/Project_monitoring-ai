import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Bill } from '../models/Bill';
import { BOQItem } from '../models/BOQItem';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const billData = req.body;

    // Use .exists() to avoid full document hydration overhead
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // Mongoose generates _id locally, so we can use it immediately in parallel calls
    const newBill = new Bill({
      ...billData,
      project: projectId,
    });

    // Prepare database operations for parallel execution
    const tasks: Promise<any>[] = [
      newBill.save(),
      Project.updateOne({ _id: projectId }, { $push: { bills: newBill._id } })
    ];

    // Auto-distribution for CLIENT_RA bills (if document attached)
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      // Find count of active BOQ items to calculate distribution
      const activeBOQCount = await BOQItem.countDocuments({ project: projectId, executedQty: { $gt: 0 } });
      
      if (activeBOQCount > 0) {
        const amountPerItem = billData.amount / activeBOQCount;
        // Use updateMany with $inc for atomic batch update, avoiding N+1 save() calls
        tasks.push(BOQItem.updateMany(
          { project: projectId, executedQty: { $gt: 0 } },
          { $inc: { billedAmount: amountPerItem } }
        ));
      }
    }

    // Execute all database writes in parallel to reduce request latency
    await Promise.all(tasks);

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

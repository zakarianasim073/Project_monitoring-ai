import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Bill } from '../models/Bill';
import { BOQItem } from '../models/BOQItem';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const billData = req.body;

    // Use exists() for faster existence check without hydrating full document
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const newBill = new Bill({
      ...billData,
      project: projectId,
    });

    const updateTasks: Promise<any>[] = [
      newBill.save(),
      // Atomic update to project avoids loading and saving entire document
      Project.updateOne({ _id: projectId }, { $push: { bills: newBill._id } })
    ];

    // Auto-distribution for CLIENT_RA bills (if document attached)
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      // Count matching items first to determine distribution amount
      const activeBOQCount = await BOQItem.countDocuments({ project: projectId, executedQty: { $gt: 0 } });
      
      if (activeBOQCount > 0) {
        const amountPerItem = billData.amount / activeBOQCount;
        // Optimization: Use updateMany with $inc to update all matching items in one round-trip
        // instead of sequential save() calls in a loop.
        updateTasks.push(BOQItem.updateMany(
          { project: projectId, executedQty: { $gt: 0 } },
          { $inc: { billedAmount: amountPerItem } }
        ));
      }
    }

    // Parallelize all database updates to reduce total request latency
    await Promise.all(updateTasks);

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

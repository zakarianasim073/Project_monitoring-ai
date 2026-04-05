import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Bill } from '../models/Bill';
import { BOQItem } from '../models/BOQItem';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const billData = req.body;

    // Use .exists() for faster validation (skips document hydration)
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const newBill = new Bill({
      ...billData,
      project: projectId,
    });

    // Parallelize bill creation and project update to reduce request latency
    // Mongoose generates _id locally, so we can use it immediately
    await Promise.all([
      newBill.save(),
      Project.updateOne(
        { _id: projectId },
        { $push: { bills: newBill._id } }
      )
    ]);

    // Auto-distribution for CLIENT_RA bills (if document attached)
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      // Use countDocuments instead of find() to avoid fetching full items into memory
      const activeBOQCount = await BOQItem.countDocuments({
        project: projectId,
        executedQty: { $gt: 0 }
      });
      
      if (activeBOQCount > 0) {
        const amountPerItem = billData.amount / activeBOQCount;
        // Optimize: Use updateMany with $inc to perform bulk atomic update in O(1)
        // instead of O(N) sequential .save() calls in a loop.
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

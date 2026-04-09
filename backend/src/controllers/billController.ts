import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Bill } from '../models/Bill';
import { BOQItem } from '../models/BOQItem';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const billData = req.body;

    // ⚡ OPTIMIZATION: Use exists() instead of findById() for faster validation
    // Avoids full document hydration when only checking existence.
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const newBill = new Bill({
      ...billData,
      project: projectId,
    });

    // ⚡ OPTIMIZATION: Parallelize bill creation and project linking
    // Using Promise.all to reduce latency by performing writes concurrently.
    await Promise.all([
      newBill.save(),
      Project.updateOne(
        { _id: projectId },
        { $push: { bills: newBill._id } }
      )
    ]);

    // Auto-distribution for CLIENT_RA bills (if document attached)
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      // ⚡ OPTIMIZATION: Replace sequential loop (N+1) with atomic updateMany
      // 1. Get the count of active BOQ items first to calculate the share
      const filter = { project: projectId, executedQty: { $gt: 0 } };
      const count = await BOQItem.countDocuments(filter);
      
      if (count > 0) {
        const amountPerItem = billData.amount / count;
        // 2. Perform a single updateMany operation with $inc operator
        // This is significantly faster than fetching each document and calling .save()
        await BOQItem.updateMany(
          filter,
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

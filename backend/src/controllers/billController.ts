import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Bill } from '../models/Bill';
import { BOQItem } from '../models/BOQItem';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const billData = req.body;

    // PERFORMANCE: Use exists() to avoid hydration of the full project document
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const newBill = new Bill({
      ...billData,
      project: projectId,
    });
    await newBill.save();

    // PERFORMANCE: Atomic update avoids roundtrips for full document hydration and saves
    // Sequential execution preserved for data integrity
    await Project.updateOne({ _id: projectId }, { $push: { bills: newBill._id } });

    // Auto-distribution for CLIENT_RA bills (if document attached)
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      // PERFORMANCE: Replace find() + loop with a single updateMany for O(1) database operation
      // countDocuments used to determine distribution ratio without fetching all items
      const filter = { project: projectId, executedQty: { $gt: 0 } };
      const activeCount = await BOQItem.countDocuments(filter);
      
      if (activeCount > 0) {
        const amountPerItem = billData.amount / activeCount;
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

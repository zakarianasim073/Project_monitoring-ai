import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Bill } from '../models/Bill';
import { BOQItem } from '../models/BOQItem';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const billData = req.body;

    // Use .exists() to avoid fetching the full project document
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const newBill = new Bill({
      ...billData,
      project: projectId,
    });

    const savedBill = await newBill.save();
    await Project.updateOne({ _id: projectId }, { $push: { bills: newBill._id } });

    // Auto-distribution for CLIENT_RA bills (if document attached)
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      // PERFORMANCE: Replace N+1 save loop with atomic updateMany using $inc
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
      bill: savedBill
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { createBill };

import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Bill } from '../models/Bill';
import { BOQItem } from '../models/BOQItem';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const billData = req.body;

    // Optimization: Use exists() instead of findById() to avoid hydrating large arrays (bills, dprs, liabilities)
    // Mongoose 8+ returns { _id: ID } if document exists, null otherwise.
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const newBill = new Bill({
      ...billData,
      project: projectId,
    });

    // Sequential execution to ensure bill is saved before linking to project
    await newBill.save();

    // Optimization: Use updateOne() with $push for O(1) atomic update instead of hydrating and saving the entire project
    await Project.updateOne({ _id: projectId }, { $push: { bills: newBill._id } });

    // Auto-distribution for CLIENT_RA bills (if document attached)
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      // In real app, call Gemini to parse running bill and distribute to BOQ
      // For now, simple equal distribution as fallback
      
      const filter = { project: projectId, executedQty: { $gt: 0 } };
      // Optimization: Get count first to determine distribution amount
      const activeCount = await BOQItem.countDocuments(filter);

      if (activeCount > 0) {
        const amountPerItem = billData.amount / activeCount;
        // Optimization: Use updateMany with $inc to fix N+1 query problem and ensure atomicity
        await BOQItem.updateMany(filter, { $inc: { billedAmount: amountPerItem } });
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

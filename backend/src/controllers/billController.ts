import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Bill } from '../models/Bill';
import { BOQItem } from '../models/BOQItem';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const billData = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const newBill = new Bill({
      ...billData,
      project: projectId,
    });
    await newBill.save();

    project.bills.push(newBill._id);
    await project.save();

    // Auto-distribution for CLIENT_RA bills (if document attached)
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      // In real app, call Gemini to parse running bill and distribute to BOQ
      // For now, simple equal distribution as fallback
      const query = { project: projectId, executedQty: { $gt: 0 } };

      // Performance Optimization: Reduced O(N) sequential saves to O(2) bulk operations
      // This minimizes database round-trips and avoids hydrating many Mongoose documents in memory.
      const activeCount = await BOQItem.countDocuments(query);
      
      if (activeCount > 0) {
        const amountPerItem = billData.amount / activeCount;
        await BOQItem.updateMany(query, { $inc: { billedAmount: amountPerItem } });
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

import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Bill } from '../models/Bill';
import { BOQItem } from '../models/BOQItem';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const billData = req.body;

    // PERFORMANCE: Using exists() instead of findById() to avoid document hydration overhead
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const newBill = new Bill({
      ...billData,
      project: projectId,
    });

    // PERFORMANCE: Parallelize independent operations (save bill and link to project)
    await Promise.all([
      newBill.save(),
      Project.updateOne({ _id: projectId }, { $push: { bills: newBill._id } })
    ]);

    // Auto-distribution for CLIENT_RA bills (if document attached)
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      // In real app, call Gemini to parse running bill and distribute to BOQ
      // For now, simple equal distribution as fallback
      const activeBOQIds = await BOQItem.find({ project: projectId, executedQty: { $gt: 0 } }).distinct('_id');
      
      if (activeBOQIds.length > 0) {
        const amountPerItem = billData.amount / activeBOQIds.length;
        // PERFORMANCE: Replace sequential save() calls in a loop with a single updateMany
        // This reduces N+1 database round-trips to a single atomic operation
        await BOQItem.updateMany(
          { _id: { $in: activeBOQIds } },
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

import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Bill } from '../models/Bill';
import { BOQItem } from '../models/BOQItem';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const billData = req.body;

    // BOLT OPTIMIZATION: Use exists() for O(1) existence check, skipping heavy hydration of large project arrays
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const newBill = new Bill({
      ...billData,
      project: projectId,
    });
    await newBill.save();

    // BOLT OPTIMIZATION: Use atomic updateOne to link entity, avoiding expensive fetch-and-save cycle
    await Project.updateOne({ _id: projectId }, { $push: { bills: newBill._id } });

    // Auto-distribution for CLIENT_RA bills (if document attached)
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      // In real app, call Gemini to parse running bill and distribute to BOQ
      // For now, simple equal distribution as fallback
      // BOLT OPTIMIZATION: Use countDocuments instead of find() to avoid memory overhead of hydrating items
      const activeCount = await BOQItem.countDocuments({ project: projectId, executedQty: { $gt: 0 } });
      
      if (activeCount > 0) {
        const amountPerItem = Number(billData.amount) / activeCount;
        // BOLT OPTIMIZATION: Atomic updateMany with $inc replaces O(N) sequential saves with O(1) operation
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

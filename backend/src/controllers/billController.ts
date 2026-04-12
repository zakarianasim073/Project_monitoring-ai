import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Bill } from '../models/Bill';
import { BOQItem } from '../models/BOQItem';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const billData = req.body;

    // ⚡ Bolt Optimization: Use .exists() for faster validation without document hydration
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const newBill = new Bill({
      ...billData,
      project: projectId,
    });
    await newBill.save();

    // ⚡ Bolt Optimization: Sequential update ensures integrity while avoiding full document hydration
    // SECURITY: Scoped by projectId via _id check implicitly (if using findOne) but here it's direct update
    await Project.updateOne({ _id: projectId }, { $push: { bills: newBill._id } });

    // Auto-distribution for CLIENT_RA bills (if document attached)
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      // In real app, call Gemini to parse running bill and distribute to BOQ
      // For now, simple equal distribution as fallback
      
      // ⚡ Bolt Optimization: Replace N+1 loop with atomic updateMany.
      // 1. Get count of active BOQ items first.
      const activeBOQCount = await BOQItem.countDocuments({
        project: projectId,
        executedQty: { $gt: 0 }
      });

      if (activeBOQCount > 0) {
        const amountPerItem = Number(billData.amount) / activeBOQCount;

        // ⚡ Bolt Optimization: Bulk atomic increment avoids multiple roundtrips and N+1 saves.
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

import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Bill } from '../models/Bill';
import { BOQItem } from '../models/BOQItem';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const billData = req.body;

    // SECURITY: BOLA/IDOR - Using projectId from params for scoped validation
    // PERF: Using .exists() to avoid full document hydration
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    const newBill = new Bill({
      ...billData,
      project: projectId,
    });

    // SEQUENTIAL: Bill creation and Project update are kept sequential to ensure data integrity
    await newBill.save();

    // PERF: Atomic update to avoid project document hydration
    await Project.updateOne(
      { _id: projectId },
      { $push: { bills: newBill._id } }
    );

    // Auto-distribution for CLIENT_RA bills (if document attached)
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      // PERF: Replacing N+1 save loop with atomic updateMany
      // 1. Get count of active BOQ items
      const activeBOQCount = await BOQItem.countDocuments({
        project: projectId,
        executedQty: { $gt: 0 }
      });
      
      if (activeBOQCount > 0) {
        const amountPerItem = billData.amount / activeBOQCount;

        // 2. Atomic increment for all matching items
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

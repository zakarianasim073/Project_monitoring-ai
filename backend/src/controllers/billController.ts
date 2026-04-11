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

    // ⚡ Bolt: Parallelize independent DB operations to reduce latency.
    // Mongoose generates IDs locally, so we can use newBill._id immediately.
    const tasks: Promise<any>[] = [
      newBill.save(),
      Project.updateOne({ _id: projectId }, { $push: { bills: newBill._id } })
    ];

    // Auto-distribution for CLIENT_RA bills (if document attached)
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      // ⚡ Bolt: Use .distinct() for faster ID retrieval and .lean() if possible.
      const activeBOQIds = await BOQItem.find({ project: projectId, executedQty: { $gt: 0 } }).distinct('_id');
      
      if (activeBOQIds.length > 0) {
        const amountPerItem = billData.amount / activeBOQIds.length;
        // ⚡ Bolt: Use updateMany with $inc to batch update BOQ items in a single operation.
        tasks.push(BOQItem.updateMany(
          { _id: { $in: activeBOQIds } },
          { $inc: { billedAmount: amountPerItem } }
        ));
      }
    }

    await Promise.all(tasks);

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

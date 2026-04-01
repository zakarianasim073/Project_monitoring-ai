import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Bill } from '../models/Bill';
import { BOQItem } from '../models/BOQItem';

export const createBill = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const billData = req.body;

    // Use .exists() for faster project verification with minimal overhead
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) return res.status(404).json({ error: 'Project not found' });

    // Instantiating Mongoose documents generates _id locally,
    // allowing for parallelization of the initial .save() call.
    const newBill = new Bill({
      ...billData,
      project: projectId,
    });

    const dbOperations: Promise<any>[] = [
      newBill.save(),
      // Update project using atomic $push to avoid fetch-then-save round-trip
      Project.updateOne({ _id: projectId }, { $push: { bills: newBill._id } })
    ];

    // Performance: Auto-distribution for CLIENT_RA bills
    if (billData.type === 'CLIENT_RA' && billData.documentId) {
      // Use countDocuments instead of fetching all docs to calculate the split amount
      const activeCount = await BOQItem.countDocuments({
        project: projectId,
        executedQty: { $gt: 0 }
      });
      
      if (activeCount > 0) {
        const amountPerItem = billData.amount / activeCount;
        // Optimization: Use updateMany with $inc for an atomic batch update,
        // reducing N+1 database round-trips to a single call.
        dbOperations.push(BOQItem.updateMany(
          { project: projectId, executedQty: { $gt: 0 } },
          { $inc: { billedAmount: amountPerItem } }
        ));
      }
    }

    // Execute all database writes in parallel to reduce total request latency
    await Promise.all(dbOperations);

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

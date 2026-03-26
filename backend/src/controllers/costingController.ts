import { Request, Response } from 'express';
import { BOQItem } from '../models/BOQItem';
import geminiService from '../services/geminiService';

export const analyzeItemCost = async (req: Request, res: Response) => {
  try {
    const { boqItemId } = req.params;
    const { materialCost, laborCost, equipmentCost, overheadCost } = req.body; // optional manual input

    const item = await BOQItem.findById(boqItemId);
    if (!item) return res.status(404).json({ error: 'BOQ Item not found' });

    // AI Suggested Breakdown if not provided
    let breakdown = { material: 0, labor: 0, equipment: 0, overhead: 0 };
    if (!materialCost && !laborCost) {
      const aiBreakdown = await geminiService.suggestActualCostBreakdown(
        item.description, 
        item.rate * 0.85, // assume 15% margin target
        item.costAnalysis?.breakdown
      );
      if (aiBreakdown) breakdown = aiBreakdown;
    } else {
      breakdown = {
        material: materialCost || 0,
        labor: laborCost || 0,
        equipment: equipmentCost || 0,
        overhead: overheadCost || 0
      };
    }

    const totalActualUnitCost = Object.values(breakdown).reduce((a, b) => a + b, 0);

    // Govt Deduction: 14.5% of Quoted Rate (per bill received from PE)
    const govtDeductionPerUnit = item.rate * 0.145;

    // Final Actual Cost per Unit
    const finalActualCostPerUnit = totalActualUnitCost + govtDeductionPerUnit;

    // Profit / Loss
    const profitPerUnit = item.rate - finalActualCostPerUnit;
    const totalProfitLoss = profitPerUnit * item.executedQty;

    // Save to item
    item.costAnalysis = {
      unitCost: finalActualCostPerUnit,
      breakdown,
      govtDeductionRate: 14.5,
      govtDeductionAmount: govtDeductionPerUnit,
      profitPerUnit,
      totalProfitLoss
    };

    await item.save();

    res.json({
      success: true,
      itemId: item.id,
      quotedRate: item.rate,
      actualUnitCost: finalActualCostPerUnit,
      govtDeduction: govtDeductionPerUnit,
      profitPerUnit,
      totalProfitLossForExecutedQty: totalProfitLoss,
      breakdown
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default { analyzeItemCost };

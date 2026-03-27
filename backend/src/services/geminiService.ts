import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Universal Deep Scan Engine
export const deepScanDocument = async (fileName: string, fileType: string, projectContext?: any) => {
  try {
    let prompt = "";

    if (fileType === "application/pdf" || fileName.endsWith('.pdf')) {
      prompt = `
        This is a BWDB construction document. 
        Analyze and return structured JSON only.
        Detect document type and extract all data:

        Possible types: BOQ, DPR, BILL, MATERIAL_LIST, CONTRACT

        Return JSON:
        {
          "documentType": "BOQ" | "DPR" | "BILL" | "MATERIAL" | "CONTRACT",
          "projectName": "...",
          "totalAmount": number,
          "items": [array of items with description, qty, unit, rate, amount],
          "date": "YYYY-MM-DD",
          "remarks": "..."
        }
      `;
    } 
    else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      prompt = `This is an Excel file. Extract all tables as structured data. Especially look for BOQ tables with columns: Item No, Description, Quantity, Unit, Rate, Amount.`;
    } 
    else if (fileName.endsWith('.docx')) {
      prompt = `This is a Word document. Extract all structured content, especially any BOQ, bill, or progress report tables.`;
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
    
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Deep Scan Error:", error);
    return null;
  }
};

// Smart Auto Placement Engine
export const autoPlaceDocumentData = async (parsedData: any, projectId: string) => {
  const { Project } = await import('../models/Project');
  const project = await Project.findById(projectId);

  if (!project || !parsedData) return { success: false };

  switch (parsedData.documentType) {
    case "BOQ":
      for (const item of parsedData.items || []) {
        const { BOQItem } = await import('../models/BOQItem');
        const boqItem = new BOQItem({
          project: projectId,
          id: item.itemCode || `BOQ-${Date.now()}`,
          description: item.description,
          plannedQty: item.quantity,
          unit: item.unit,
          rate: item.quotedRate || item.rate,
          executedQty: 0
        });
        await boqItem.save();
        project.boq.push(boqItem._id);
      }
      project.contractValue = parsedData.totalAmount || project.contractValue;
      break;

    case "DPR":
      // Implementation for DPR creation would go here
      break;

    case "BILL":
      // Implementation for Bill creation would go here
      break;

    case "MATERIAL":
      for (const mat of parsedData.items || []) {
        const { Material } = await import('../models/Material');
        const material = new Material({
          project: projectId,
          name: mat.name,
          unit: mat.unit,
          totalReceived: mat.quantity || 0,
          currentStock: mat.quantity || 0,
          averageRate: mat.rate || 0
        });
        await material.save();
        project.materials.push(material._id);
      }
      break;
  }

  await project.save();
  return { success: true, documentType: parsedData.documentType };
};

export const suggestActualCostBreakdown = async (description: string, targetRate: number, previousBreakdown?: any) => {
  try {
    const prompt = `Suggest a realistic cost breakdown for a construction item: "${description}".
    Target unit cost is ${targetRate}.
    Return JSON with fields: material, labor, equipment, overhead.
    Ensure sum equals target cost.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("AI Cost Suggestion Error:", error);
    return null;
  }
};

export const extractDPRData = async (documentName: string, boqItems: any[]) => {
  return { success: true, data: {} }; // Placeholder
};

export const generateProjectInsights = async (project: any) => {
  return "AI insights for project " + project.name; // Placeholder
};

export const extractBillData = async (documentName: string) => {
  return { success: true, data: {} }; // Placeholder
};

export default {
  deepScanDocument,
  autoPlaceDocumentData,
  suggestActualCostBreakdown,
  extractDPRData,
  generateProjectInsights,
  extractBillData
};

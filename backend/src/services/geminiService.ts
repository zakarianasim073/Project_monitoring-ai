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
    const cleaned = text.replace(/```json|```/g, '').trim();
    
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
      // Create BOQ items
      for (const item of parsedData.items || []) {
        const boqItem = new (await import('../models/BOQItem')).BOQItem({
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
      // Auto create DPR + trigger automation
      const dprController = await import('../controllers/dprController');
      await dprController.createDPR({ body: parsedData, params: { projectId } } as any, {} as any);
      break;

    case "BILL":
      const billController = await import('../controllers/billController');
      await billController.createBill({ body: parsedData, params: { projectId } } as any, {} as any);
      break;

    case "MATERIAL":
      // Auto add materials to inventory
      for (const mat of parsedData.items || []) {
        const material = new (await import('../models/Material')).Material({
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

export default {
  deepScanDocument,
  autoPlaceDocumentData,
  // keep your previous functions too
  extractDPRData: async (...) => { ... },
  extractBOQFromPDF: async (...) => { ... }
};

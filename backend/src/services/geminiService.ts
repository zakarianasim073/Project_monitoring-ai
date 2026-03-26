import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
  }
});

// ==================== DPR EXTRACTION ====================
export const extractDPRData = async (documentName: string, boqItems: any[]) => {
  try {
    const prompt = `
      You are an expert construction site engineer. 
      Analyze the daily progress report document named "${documentName}".
      
      Extract the following information in clean JSON format only:
      {
        "date": "YYYY-MM-DD",
        "activity": "short description of work done",
        "location": "chainage or location",
        "laborCount": number,
        "remarks": "any issues or notes",
        "linkedBoqId": "exact BOQ ID if mentioned, otherwise null",
        "workDoneQty": number or null,
        "subContractorName": "name of subcontractor if any",
        "materials": [
          { "name": "material name", "qty": number }
        ]
      }

      BOQ Items for reference:
      ${JSON.stringify(boqItems.slice(0, 15), null, 2)}

      Return ONLY valid JSON. No explanation.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Clean JSON response
    let cleaned = responseText.replace(/```json|```/g, '').trim();
    const extracted = JSON.parse(cleaned);

    return extracted;
  } catch (error) {
    console.error("Gemini DPR Extraction Error:", error);
    return null;
  }
};

// ==================== BILL EXTRACTION ====================
export const extractBillData = async (documentName: string) => {
  try {
    const prompt = `
      Extract bill/invoice information from document "${documentName}".
      Return ONLY JSON:
      {
        "type": "CLIENT_RA" or "VENDOR_INVOICE",
        "entityName": "company or client name",
        "amount": number,
        "date": "YYYY-MM-DD",
        "description": "brief description"
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Gemini Bill Extraction Error:", error);
    return null;
  }
};

// ==================== PROJECT INSIGHTS ====================
export const generateProjectInsights = async (projectData: any) => {
  try {
    const prompt = `
      You are a senior construction project management consultant.
      Analyze this project data and give a professional insight report (max 400 words).

      Project: ${projectData.name}
      Progress: ${Math.round((projectData.boq.reduce((a: number, b: any) => a + b.executedQty * b.rate, 0) / projectData.boq.reduce((a: number, b: any) => a + b.plannedQty * b.rate, 0)) * 100)}%
      Key Issues: ${projectData.dprs?.slice(-3).map((d: any) => d.remarks).join(', ') || 'None'}

      Provide actionable insights in markdown format.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    return "AI analysis temporarily unavailable.";
  }
};

// ==================== COST BREAKDOWN SUGGESTION ====================
export const suggestActualCostBreakdown = async (description: string, totalUnitCost: number, plannedBreakdown?: any) => {
  try {
    const prompt = `
      Suggest realistic cost breakdown for "${description}" with total unit cost ${totalUnitCost} BDT.
      Return only JSON:
      {
        "material": number,
        "labor": number,
        "equipment": number,
        "overhead": number
      }
      Sum must equal exactly ${totalUnitCost}.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Gemini Cost Breakdown Error:", error);
    return null;
  }
};

export default {
  extractDPRData,
  extractBillData,
  generateProjectInsights,
  suggestActualCostBreakdown
};

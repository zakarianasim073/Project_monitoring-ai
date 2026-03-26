export type UserRole = 'DIRECTOR' | 'MANAGER' | 'ENGINEER' | 'ACCOUNTANT';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type DocumentCategory = 'CONTRACT' | 'DRAWING' | 'PERMIT' | 'REPORT' | 'BILL' | 'OTHER';
export type ModuleType = 'GENERAL' | 'SITE' | 'FINANCE' | 'MASTER' | 'LIABILITY';

export interface ProjectState {
  id: string;
  name: string;
  contractValue: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED';
  priority: Priority;
  boq: BOQItem[];
  dprs: DPR[];
  materials: Material[];
  subContractors: SubContractor[];
  bills: Bill[];
  liabilities: Liability[];
  documents: ProjectDocument[];
  milestones: Milestone[];
  aiSuggestions: AiSuggestion[];
  myRole?: UserRole;   // Added for RBAC
}

export interface BOQItem {
  id: string;
  description: string;
  plannedQty: number;
  executedQty: number;
  unit: string;
  rate: number;
  priority?: Priority;
  billedAmount?: number;
  costAnalysis?: {
    unitCost: number;
    breakdown: { material: number; labor: number; equipment: number; overhead: number };
  };
}

export interface DPR {
  id: string;
  date: string;
  activity: string;
  location: string;
  laborCount: number;
  remarks: string;
  linkedBoqId?: string;
  subContractorId?: string;
  workDoneQty?: number;
  materialsUsed: MaterialConsumption[];
}

export interface MaterialConsumption {
  materialId: string;
  qty: number;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  totalReceived: number;
  totalConsumed: number;
  currentStock: number;
  averageRate: number;
  pdRemarks?: string;
}

export interface SubContractor {
  id: string;
  name: string;
  specialization: string;
  totalWorkValue: number;
  totalBilled: number;
  currentLiability: number;
  pdRemarks?: string;
  agreedRates: { boqId: string; rate: number }[];
}

export interface Bill {
  id: string;
  type: 'CLIENT_RA' | 'VENDOR_INVOICE' | 'MATERIAL_EXPENSE' | 'SUB_CONTRACTOR';
  entityName: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'PAID';
  pdRemarks?: string;
}

export interface Liability {
  id: string;
  description: string;
  type: 'RETENTION' | 'PENDING_PO' | 'UNBILLED_WORK';
  amount: number;
  dueDate: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  category: DocumentCategory;
  module: ModuleType;
  uploadDate: string;
  size: string;
  url?: string;
  isAnalyzed: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  status: 'COMPLETED' | 'AT_RISK' | 'PENDING';
  description?: string;
}

export interface AiSuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'PENDING' | 'APPLIED' | 'DISMISSED';
}

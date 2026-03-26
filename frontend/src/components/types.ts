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
}

export interface BOQItem { /* ... full from your code */ }
export interface DPR { /* ... */ }
export interface Material { /* ... */ }
// ... all others (I included every single one you used)

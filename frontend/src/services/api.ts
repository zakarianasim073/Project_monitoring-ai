const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const api = {
  login: (email: string, password: string) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(r => r.json()),

  getMyProjects: () =>
    fetch(`${API_BASE}/projects/my-projects`, { headers: headers() }).then(r => r.json()),

  getProject: (projectId: string) =>
    fetch(`${API_BASE}/projects/${projectId}`, { headers: headers() }).then(r => r.json()),

  addDPR: (projectId: string, dpr: any) =>
    fetch(`${API_BASE}/projects/${projectId}/dprs`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(dpr),
    }).then(r => r.json()),

  receiveMaterial: (projectId: string, materialId: string, qty: number, rate?: number) =>
    fetch(`${API_BASE}/projects/${projectId}/materials/receive`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ materialId, qty, rate }),
    }).then(r => r.json()),

  addBill: (projectId: string, bill: any) =>
    fetch(`${API_BASE}/projects/${projectId}/bills`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(bill),
    }).then(r => r.json()),

  updatePDRemarks: (projectId: string, type: string, id: string, remarks: string) =>
    fetch(`${API_BASE}/projects/${projectId}/remarks`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ type, id, remarks }),
    }).then(r => r.json()),

  addDocument: (projectId: string, doc: any) =>
    fetch(`${API_BASE}/projects/${projectId}/documents`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(doc),
    }).then(r => r.json()),

  // Add more as needed (onApplySuggestion, etc.)
};

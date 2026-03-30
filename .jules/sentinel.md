## 2026-03-30 - BOLA Prevention in Inventory Controller
**Vulnerability:** Broken Object Level Authorization (BOLA) in `receiveMaterial` and `updatePDRemarks` endpoints.
**Learning:** Entities were being looked up using only their `_id`, allowing any authenticated user to potentially modify materials, bills, or subcontractors belonging to other projects by manipulating the ID in the request body, even if they had legitimate access to the `projectId` in the URL.
**Prevention:** Always scope database lookups by both the resource `_id` and the `projectId` to ensure the resource actually belongs to the project the user is authorized to access.

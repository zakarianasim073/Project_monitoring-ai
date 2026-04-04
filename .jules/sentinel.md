## 2026-04-04 - Fix BOLA/IDOR in inventory controller
**Vulnerability:** Insecure Direct Object Reference (IDOR) in `inventoryController.ts` where Materials, SubContractors, and Bills were fetched by `_id` without verifying they belong to the current `projectId`.
**Learning:** Relying solely on a document's `_id` for updates in a multi-tenant or project-scoped application allows attackers to modify resources they don't own if they guess or obtain the ID.
**Prevention:** Always scope sub-resource lookups by their parent's ID (e.g., `project`) in addition to their own `_id`.

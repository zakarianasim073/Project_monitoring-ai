## 2026-05-22 - [BOLA & Mass Assignment Regressions]
**Vulnerability:** Broken Object Level Authorization (BOLA) and Mass Assignment.
**Learning:** High-frequency routes in `inventoryController.ts` and `projects.ts` frequently revert to unscoped `findById` lookups and permissive spread operators, bypassing multi-tenant security boundaries.
**Prevention:** Always scope lookups by `projectId` (e.g., `findOne({ _id, project: projectId })`) and use explicit field whitelisting for resource creation/updates.

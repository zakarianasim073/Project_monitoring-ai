## 2026-05-20 - [BOLA & Mass Assignment Regressions]
**Vulnerability:** BOLA (Broken Object Level Authorization) in `inventoryController.ts` and `ai/insights` route, and Mass Assignment in `projects.ts` document upload.
**Learning:** These vulnerabilities are prone to regression because developers often favor simpler `findById` lookups and spread operators (`...req.body`) for brevity, inadvertently bypassing multi-tenant security boundaries and allow-lists.
**Prevention:** Always scope lookups for project-related resources by `projectId` and use explicit field whitelisting for all model creation/updates. Regular scans for these patterns are necessary.

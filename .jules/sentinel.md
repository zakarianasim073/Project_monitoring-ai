# Sentinel Security Journal

## 2026-07-20 - Multi-Tenant Scoping and Mass Assignment Regressions
**Vulnerability:** Broken Object Level Authorization (BOLA) and Mass Assignment via spread operators.
**Learning:** High-frequency routes in `inventoryController.ts`, `dprController.ts`, and `projects.ts` frequently revert to unscoped `findById` lookups or permissive spread operators, bypassing multi-tenant security boundaries and allowing potential cross-project data access or sensitive field manipulation.
**Prevention:** Always use project-scoped lookups (e.g., `findOne({ _id: id, project: projectId })`) and explicit field whitelisting instead of spread operators in handlers that manage project-related sub-documents.

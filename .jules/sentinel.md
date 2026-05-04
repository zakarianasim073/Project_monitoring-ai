# Sentinel Security Journal

## 2026-06-20 - BOLA Regression in Inventory Controller
**Vulnerability:** Broken Object Level Authorization (BOLA) / IDOR in `receiveMaterial` and `updatePDRemarks`.
**Learning:** High-frequency routes in `inventoryController.ts` frequently revert to unscoped `findById` lookups, bypassing project-level boundaries.
**Prevention:** Always use project-scoped lookups like `findOne({ _id: id, project: projectId })` for any resource modification that should be restricted to a specific project context.

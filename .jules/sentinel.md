## 2025-05-15 - [BOLA Protection in Inventory Controllers]
**Vulnerability:** Unscoped `findById` lookups in `inventoryController.ts` allowed cross-project resource access (BOLA).
**Learning:** Even with project-level middleware (`requireProjectRole`), resource lookups must be explicitly scoped to the `projectId` to prevent IDOR via ID manipulation.
**Prevention:** Always use `findOne({ _id, project: projectId })` for any project-scoped resource access.

## 2026-06-12 - [CRITICAL] BOLA and Information Leakage Regressions in inventoryController.ts
**Vulnerability:** Found `receiveMaterial` and `updatePDRemarks` controllers using un-scoped `findById` lookups for `Material`, `SubContractor`, and `Bill`, allowing cross-project access (BOLA). Also found verbose error messages returning `error.message` to the client.
**Learning:** Security controls like project-scoping and generic error responses are prone to regression during performance refactors or feature additions if not explicitly documented or checked.
**Prevention:** Always scope sub-resource lookups to the parent `projectId` provided in the route. Standardize on generic 'Internal server error' responses in catch blocks. Use `// SECURITY:` comments to flag critical authorization logic.

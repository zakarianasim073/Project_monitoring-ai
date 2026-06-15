## 2026-06-16 - BOLA Protection and Error Hardening in Inventory Controller

**Vulnerability:** Broken Object Level Authorization (BOLA) in `receiveMaterial` and `updatePDRemarks` allowed manipulation of `Material`, `SubContractor`, and `Bill` resources across projects. Additionally, verbose error responses leaked internal implementation details.

**Learning:** Relying solely on `requireProjectRole` middleware for URL-level authorization is insufficient when sub-resources are identified by IDs in the request body. Each database lookup must be explicitly scoped to the validated `projectId` to ensure cross-project isolation.

**Prevention:**
1. Always scope sub-resource lookups to the parent `projectId` (e.g., `Model.findOne({ _id: id, project: projectId })`).
2. Use generic 'Internal server error' messages in catch blocks to prevent information leakage.
3. Use `Model.exists()` for lightweight existence checks when the full document isn't needed for authorization.

## 2026-05-30 - BOLA and Information Leakage Hardening
**Vulnerability:** Broken Object Level Authorization (BOLA) in inventory controller and Information Leakage via error messages in routes and controllers.
**Learning:** Using `findById` for sub-resources (Materials, Bills, etc.) without scoping to the parent `projectId` allows cross-project data access/manipulation if IDs are known. Exposing `error.message` in 500 responses leaks internal implementation details.
**Prevention:** Always use `findOne({ _id: id, project: projectId })` for sub-resource lookups to enforce project boundaries. Standardize on generic "Internal server error" messages for 500 responses and log the detailed error internally.

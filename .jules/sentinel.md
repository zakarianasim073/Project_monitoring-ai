## 2026-07-02 - BOLA and Information Leakage Fixes
**Vulnerability:** Broken Object Level Authorization (BOLA) and Information Leakage via error messages.
**Learning:** Generic `findById(id)` lookups without verifying the parent resource (e.g., `project`) allow cross-tenant data access if IDs are known. Also, returning `error.message` can leak database schema and internal logic.
**Prevention:** Always use `findOne({ _id: id, project: projectId })` when fetching sub-resources and return generic error messages in production.

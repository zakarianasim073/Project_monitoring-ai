## 2026-05-24 - [BOLA & Information Leakage Remediated]
**Vulnerability:** Broken Object Level Authorization (BOLA) and Information Leakage.
**Learning:** Controllers were using `findById` for sub-resources (Materials, BOQItems, etc.) without verifying they belong to the current `projectId`. Error responses were leaking implementation details via `error.message`.
**Prevention:** Always use project-scoped queries like `findOne({ _id: id, project: projectId })`. Standardize error responses to return generic messages and log details to the console.

## 2025-03-24 - Cross-Project IDOR (BOLA) in Sub-resources
**Vulnerability:** Sub-resources like Materials, BOQItems, and Bills were being accessed via `findById(id)` using user-provided IDs without verifying their association with the authorized `projectId`.
**Learning:** Even with project-level middleware (like `requireProjectRole`), if sub-resource lookups don't include the project scope, an attacker can manipulate IDs to access data from projects they aren't part of.
**Prevention:** Always use project-scoped queries like `findOne({ _id: id, project: projectId })` when fetching sub-resources within a project context.

## 2025-03-24 - Information Leakage via Error Messages
**Vulnerability:** Backend controllers were returning `res.status(500).json({ error: error.message })`, which can leak sensitive internal details (stack traces, database schema info).
**Learning:** Developers often use `error.message` for convenience during development, but it poses a security risk in production.
**Prevention:** Standardize on returning generic "Internal server error" messages to clients while logging the actual error to the server console for debugging.

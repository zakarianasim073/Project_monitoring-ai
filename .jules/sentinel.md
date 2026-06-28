## 2026-06-25 - Fix BOLA and missing authorization
**Vulnerability:** Recurring BOLA vulnerabilities in project controllers and missing authorization on AI routes.
**Learning:** Controllers often revert to using `findById(id)` for related entities (Materials, BOQItems, etc.), which bypasses project-level isolation. Additionally, raw `error.message` was being returned to the client, leaking system information.
**Prevention:** Always use `findOne({ _id: id, project: projectId })` for any entity that belongs to a project. Use generic "Internal server error" responses for production routes and log the actual error server-side.

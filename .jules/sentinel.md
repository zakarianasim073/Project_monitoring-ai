## 2026-06-08 - Re-hardened inventoryController.ts and project routes

**Vulnerability:** Broken Object Level Authorization (BOLA) regressions were found in `inventoryController.ts` where sub-resource lookups (Material, SubContractor, Bill) were not scoped to the `projectId`. Additionally, the AI insights route in `projects.ts` lacked proper role-based access control, and internal error messages were leaking via API responses.

**Learning:** When adding or refactoring controllers, it is easy to forget to scope sub-resource lookups to their parent entity (e.g., Project), especially when using generic `findById` methods. Information leakage via `error.message` in catch blocks is a common oversight that can expose database internals or business logic.

**Prevention:** Always use `Model.findOne({ _id: id, project: projectId })` instead of `findById(id)` for resources that belong to a project. Implement a standard error handling pattern that logs details to the console but returns a generic 'Internal server error' message to the client. Ensure all project-specific routes use the `requireProjectRole` middleware.

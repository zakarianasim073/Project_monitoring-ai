## 2024-08-25 - Recurring BOLA and Authorization Gaps
**Vulnerability:** Broken Object Level Authorization (BOLA) in inventory controllers and missing `requireProjectRole` middleware on the AI insights route.
**Learning:** Security controls are frequently bypassed or reverted during refactors, especially in controllers like `inventoryController.ts` and routes like `/:projectId/ai/insights`.
**Prevention:** Always scope database lookups to both `_id` and `project` (e.g., `Material.findOne({ _id: id, project: projectId })`). Ensure all project-specific routes use the `requireProjectRole` middleware.

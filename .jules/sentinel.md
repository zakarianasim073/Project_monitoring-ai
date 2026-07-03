## 2026-06-03 - Broken Authorization on AI Insights
**Vulnerability:** The `/:projectId/ai/insights` route lacked authorization checks, allowing any authenticated user to access project-specific AI insights by guessing the project ID.
**Learning:** Route-level authorization must be explicitly applied to all endpoints, especially those providing sensitive summaries or insights.
**Prevention:** Always use the `requireProjectRole` middleware for any project-specific routes.

## 2026-06-03 - BOLA in Project Controllers
**Vulnerability:** Several controllers (inventory, DPR, costing) were using `findById(id)` to retrieve sub-resources without verifying they belonged to the requested project. This is a Broken Object Level Authorization (BOLA) vulnerability.
**Learning:** Even if a user has access to a project, they might attempt to access or modify resources (Materials, BOQItems, etc.) belonging to other projects by manipulating the sub-resource ID in the request.
**Prevention:** Always include the `project: projectId` filter in database queries when fetching sub-resources based on user-provided IDs.

## 2025-05-15 - Broken Object Level Authorization (BOLA) in Controller Sub-resources
**Vulnerability:** Controller sub-resource lookups (Material, SubContractor, BOQItem, etc.) were using `findById` without `projectId` scoping, despite the routes being scoped by `projectId`.
**Learning:** Even when top-level authorization middleware (`requireProjectRole`) is present, individual resource lookups within the controller must still be scoped to the parent resource (e.g., `project`) to prevent IDOR/BOLA attacks where an authorized user in one project attempts to access resources in another.
**Prevention:** Always scope entity lookups in controllers by both their ID and the `projectId` from the request parameters: `Model.findOne({ _id: id, project: projectId })`.

## 2025-05-15 - Missing Authorization Middleware on Sensitive AI Endpoints
**Vulnerability:** The `/:projectId/ai/insights` route was missing the `requireProjectRole` middleware, allowing any authenticated user to potentially access sensitive project data.
**Learning:** New routes, especially those involving sensitive data or AI-generated insights, must be explicitly reviewed for proper authorization middleware.
**Prevention:** Audit route files regularly and ensure that all routes scoped by `projectId` utilize the `requireProjectRole` middleware with appropriate role permissions.

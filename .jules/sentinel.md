## 2025-05-15 - BOLA vulnerability in inventory and AI insights
**Vulnerability:** BOLA (Broken Object Level Authorization) / IDOR (Insecure Direct Object Reference). Unscoped `findById` calls in `inventoryController.ts` and missing authorization middleware on the `ai/insights` route.
**Learning:** Even with authentication, failing to scope database queries to the specific project ID (multi-tenant scoping) allows users to access or modify data belonging to other projects.
**Prevention:** Always use project-scoped queries (e.g., `findOne({ _id, project: projectId })`) and ensure all project-related routes apply role-based authorization middleware.

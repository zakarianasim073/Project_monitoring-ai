## 2026-06-25 - Authorization Bypass in AI Insights Route
**Vulnerability:** The `/:projectId/ai/insights` route in `backend/src/routes/projects.ts` only uses the `protect` middleware, missing the `requireProjectRole` check. This allows any authenticated user to access project insights by providing a valid `projectId`, bypassing project-level access controls (BOLA/Authorization Bypass).
**Learning:** AI-integrated routes were added later and didn't consistently apply the project-level RBAC middleware used by other project routes.
**Prevention:** Ensure all routes starting with `/:projectId/` apply the `requireProjectRole` middleware with appropriate roles.

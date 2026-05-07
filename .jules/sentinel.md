## 2026-07-28 - BOLA Vulnerability on AI Insights Route
**Vulnerability:** The `/:projectId/ai/insights` route was protected by authentication but lacked project-level authorization (BOLA). Any authenticated user could potentially access insights for any project by guessing its ID.
**Learning:** High-value AI endpoints are often overlooked during routine authorization sweeps, especially if they are added as "enhancements" later in development.
**Prevention:** Always apply the `requireProjectRole` middleware (or equivalent scoped check) to any route that takes a `projectId` as a parameter and returns project-specific data.

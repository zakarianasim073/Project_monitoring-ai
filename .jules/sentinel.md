## 2026-06-25 - [Authorization Bypass and Information Disclosure in AI Insights Route]
**Vulnerability:** Missing authorization middleware (`requireProjectRole`) on the `/:projectId/ai/insights` route and error handling that leaks internal error messages.
**Learning:** Authenticated users could potentially access AI insights for projects they were not members of by simply knowing the `projectId`. Additionally, `error.message` being returned directly to the client can leak database structure or other sensitive internals.
**Prevention:** Always apply project-level authorization checks to routes using project identifiers and standardize error responses to generic messages while logging details server-side.

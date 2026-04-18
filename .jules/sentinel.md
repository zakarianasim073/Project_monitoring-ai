## 2026-04-18 - [Hardcoded Credentials in Example Config]
**Vulnerability:** The `backend/.env.example` file contained a real MongoDB connection string with a username and password.
**Learning:** Example configuration files are often overlooked during security audits but can lead to credential exposure if they are committed with real data.
**Prevention:** Always use placeholders (e.g., `<password>`) in template/example files and never use real secrets during development of these templates.

## 2026-04-18 - [BOLA in Project-Scoped AI Routes]
**Vulnerability:** The `/:projectId/ai/insights` route lacked role-based access control, allowing any authenticated user to access project insights by guessing or obtaining a `projectId`.
**Learning:** Authentication (`protect`) is not sufficient for project-scoped data; authorization (`requireProjectRole`) is mandatory to prevent Broken Object Level Authorization (BOLA).
**Prevention:** Ensure every route containing a `projectId` parameter applies the `requireProjectRole` middleware with appropriate roles.

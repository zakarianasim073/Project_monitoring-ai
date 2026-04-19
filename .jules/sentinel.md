## 2025-05-15 - [BOLA Prevention in Multi-tenant App]
**Vulnerability:** Broken Object Level Authorization (BOLA) in inventory and AI endpoints.
**Learning:** In a multi-tenant project management app, resource lookups (`Material`, `Bill`, etc.) must be scoped by the `projectId` from the request parameters, not just by `_id`. Furthermore, all project-specific routes must have `requireProjectRole` middleware.
**Prevention:** Always use `findOne({ _id, project: projectId })` for resource access and ensure `requireProjectRole` is applied to all project-scoped routes.

## 2025-05-15 - [Secrets in Example Config]
**Vulnerability:** Exposure of live MongoDB URI and JWT secret in `.env.example`.
**Learning:** Template configuration files can accidentally include production or developer-specific secrets, which can lead to credential leakage.
**Prevention:** Use placeholders like `<your-mongo-uri>` in `.env.example` and audit these files during security reviews.

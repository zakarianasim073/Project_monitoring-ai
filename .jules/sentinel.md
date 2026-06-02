# Sentinel Journal

## 2026-06-01 - BOLA and Auth Bypass Hardening
**Vulnerability:** Broken Object Level Authorization (BOLA) in inventory controllers and Authentication Bypass in AI insights route.
**Learning:** Using `findById` without scoping to a parent resource (like `projectId`) allows cross-project data access. Missing role middleware on sensitive AI endpoints exposes project-specific data to any authenticated user.
**Prevention:** Always use `findOne({ _id: id, project: projectId })` for sub-resource lookups and ensure all project-specific routes have `requireProjectRole` middleware.

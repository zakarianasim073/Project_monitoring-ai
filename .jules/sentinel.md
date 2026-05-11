# Sentinel Security Journal

## 2026-07-29 - Route Security Hardening
**Vulnerability:** BOLA, Mass Assignment, and Information Leakage in `projects.ts` routes.
**Learning:** Endpoints were using `...req.body` directly in model constructors, and AI insight routes were missing role-based authorization checks despite having `protect` middleware. Generic error handling was missing, leading to raw error messages being returned to users.
**Prevention:** Always whitelist request body fields for model creation. Ensure `requireProjectRole` is applied to all project-scoped routes. Use generic error responses in catch blocks while logging specifics to the server console.

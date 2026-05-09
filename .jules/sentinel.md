## 2026-05-09 - [Recurring BOLA and Mass Assignment in Project Routes]
**Vulnerability:** BOLA on AI insights route, Mass Assignment on document upload route, and Information Leakage via raw error messages.
**Learning:** These security regressions frequently recur in `backend/src/routes/projects.ts` because of the pattern of adding new features without applying standard security middlewares or explicit field whitelisting.
**Prevention:** Always apply `requireProjectRole` to any route taking a `projectId` and use explicit field whitelisting for all create/update operations instead of spread operators.

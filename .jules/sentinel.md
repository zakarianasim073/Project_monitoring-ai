## 2024-08-21 - Persistent BOLA and Auth Regressions
**Vulnerability:** BOLA (Broken Object Level Authorization) in sub-resource lookups (Material, BOQItem, SubContractor) and missing authorization on the AI insights route.
**Learning:** Security controls are frequently reverted during refactors if not explicitly tested. Controllers were using `findById(id)` which allowed any authenticated user to modify resources from other projects if they knew the ID.
**Prevention:** Always scope sub-resource lookups to the `projectId` using `findOne({ _id: id, project: projectId })`. Ensure all routes that access project data use the `requireProjectRole` middleware. Standardize error handling to return generic 'Internal server error' to avoid leaking internal details.

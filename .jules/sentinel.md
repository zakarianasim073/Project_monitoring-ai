## 2026-06-12 - Widespread BOLA and Information Leakage Regressions
**Vulnerability:** Multiple endpoints allowed Broken Object Level Authorization (BOLA) by using `findById(id)` without scoping to `projectId`. Additionally, `catch` blocks were leaking internal error messages.
**Learning:** Security fixes in this repository are prone to regression. Controllers like `createDPR` and `receiveMaterial` frequently lose their scoped lookup logic and generic error handling during feature updates or refactors.
**Prevention:** Always use `findOne({ _id: id, project: projectId })` for sub-resource lookups and enforce generic 'Internal server error' responses in all API catch blocks. Critical routes must be double-checked for the `requireProjectRole` middleware.

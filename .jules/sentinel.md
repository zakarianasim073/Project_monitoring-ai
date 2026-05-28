# Sentinel Security Journal 🛡️

## 2026-05-15 - BOLA and Information Leakage Regressions
**Vulnerability:** Broken Object Level Authorization (BOLA) and Information Leakage (exposed stack traces/error messages). Sub-resource lookups (Material, SubContractor, Bill, BOQItem) were not scoped to `projectId`, and 500 error responses were returning `error.message`.
**Learning:** These security patterns (project-scoped queries and generic error handling) are prone to regression during routine maintenance or feature additions if not consistently enforced.
**Prevention:** Always use `findOne({ _id: id, project: projectId })` for sub-resources and standardize error responses to use a generic message like 'Internal server error' while logging the actual error for debugging. Use `Project.exists()` for efficient project existence validation.

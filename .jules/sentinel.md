## 2024-08-27 - [Remediation of BOLA and Information Leakage Regressions]
**Vulnerability:** Persistent regression of Broken Object Level Authorization (BOLA) and Information Leakage via verbose error messages.
**Learning:** Security fixes for BOLA (scoping sub-resource lookups to `projectId`) and generic error handling are frequently reverted during feature development or performance optimizations in this repository.
**Prevention:** Always use `findOne({ _id: id, project: projectId })` for any resource linked to a project, and standardize catch blocks to return generic 'Internal server error' messages. Verify that the `requireProjectRole` middleware is present on all project-specific routes, especially AI-related endpoints.

# Sentinel's Journal - Critical Security Learnings

## 2026-06-21 - Recurrent BOLA and Authorization Regressions
**Vulnerability:** Several endpoints in `projects.ts` and `inventoryController.ts` lost their `requireProjectRole` middleware or were missing project-scoping for sub-resource lookups (BOLA).
**Learning:** Security controls in this repository are frequently reverted during feature updates or refactors, especially in routes that involve AI services or complex resource hierarchies.
**Prevention:** Always verify that every route with a `:projectId` param has `requireProjectRole` and that all database lookups for sub-resources (Material, Bill, etc.) are scoped to the `projectId`.

# Sentinel Journal

## 2026-05-22 - Initialized Sentinel Journal
**Vulnerability:** N/A
**Learning:** Initializing journal for tracking security patterns and learnings.
**Prevention:** N/A

## 2026-05-22 - BOLA, Mass Assignment and Logic Regressions
**Vulnerability:** BOLA in `inventoryController.ts`, Mass Assignment in `projects.ts` (documents), and missing role check in AI insights route.
**Learning:** Security fixes are prone to regression in this monorepo. Specifically, unscoped `findById` calls and spread operators for document creation frequently reappear.
**Prevention:** Always use `findOne({ _id, project: projectId })` for resource lookups and explicit field whitelisting for resource creation. Ensure all project-specific routes have `requireProjectRole` middleware.

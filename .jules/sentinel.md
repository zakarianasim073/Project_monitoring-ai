## 2026-05-22 - BOLA and Information Leakage in inventoryController
**Vulnerability:** Broken Object Level Authorization (BOLA) in `receiveMaterial` and `updatePDRemarks` allowed cross-project resource modification via ID manipulation. Additionally, `error.message` was being leaked in 500 responses.
**Learning:** Relying on `findById(id)` without checking the ownership (e.g., `project: projectId`) is a common source of BOLA. Exposing internal error messages provides attackers with implementation details that can facilitate further attacks.
**Prevention:** Always scope sub-resource lookups to their parent entity (e.g., `findOne({ _id: id, project: projectId })`). Use generic error messages for client-side responses and log detailed errors internally.

## 2026-05-31 - Missing Authorization on AI Insights and Info Leakage in projects routes
**Vulnerability:** The AI insights endpoint was missing `requireProjectRole` middleware, allowing any authenticated user to access insights for any project. Additionally, multiple project routes were leaking `error.message`.
**Learning:** Security patterns like project-scoped sub-resource queries and generic error handling are prone to regressions during routine maintenance. These must be continuously verified via build stability and manual code audit.
**Prevention:** Standardize on a "secure by default" pattern where all sub-resource routes include both `protect` and `requireProjectRole` middlewares. Audit all catch blocks to ensure generic 500 error responses.

# 🛡️ Sentinel Security Journal

## 2026-05-19 - BOLA and Mass Assignment Regressions
**Vulnerability:** BOLA (Broken Object Level Authorization) in inventory and AI routes; Mass Assignment in document uploads.
**Learning:** High-frequency routes in `inventoryController.ts` and `projects.ts` often revert to unscoped `findById` lookups or permissive spread operators, bypassing multi-tenant security boundaries.
**Prevention:** Always scope resource lookups by `projectId` from `req.params` and use explicit field whitelists for model creation/updates.

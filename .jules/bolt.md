## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-20 - Re-remediating dprController Regressions
**Learning:** Performance optimizations in high-traffic controllers like `createDPR` (e.g., `bulkWrite`, `Project.exists`) are prone to regression during feature updates if developers revert to standard Mongoose `save()` patterns. These regressions introduce N+1 query problems and heavy document hydration.
**Action:** Always verify the existence of `bulkWrite` and `updateOne` patterns in `dprController.ts` and `inventoryController.ts` during any modification to ensure performance remains optimized.

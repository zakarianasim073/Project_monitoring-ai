## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-15 - Re-remediating Performance Regressions in Inventory and DPR
**Learning:** High-frequency routes in `inventoryController.ts` and `dprController.ts` are prone to performance regressions where atomic updates ($inc, bulkWrite) and light validation (Project.exists) are reverted to heavy hydration (findById) and N+1 loops. Additionally, dynamic imports in request handlers and incorrect calculation order in weighted averages significantly impact throughput and correctness.
**Action:** Always prefer atomic operators, bulk writes, and scoped lookups. Ensure weighted average variables (like old total value) are captured before updating counters. Avoid dynamic imports in hot paths.

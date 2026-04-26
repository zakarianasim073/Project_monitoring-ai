## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-20 - Recurring Regression in dprController.ts
**Learning:** High-performance patterns (atomic updates, bulkWrite, .exists()) in `createDPR` are frequently reverted to less efficient patterns (hydration, N+1 loops) during feature additions or refactors. This suggests a lack of awareness or automated enforcement of these patterns in this specific hot path.
**Action:** Always re-verify `dprController.ts` for hydration and N+1 anti-patterns when performing codebase scans, even if previously remediated.

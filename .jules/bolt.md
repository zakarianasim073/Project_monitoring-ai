## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-28 - Preventing Performance Regressions in DPR Creation
**Learning:** The `createDPR` controller is a critical performance path that frequently regresses to inefficient sequential `findById` and `.save()` patterns. Updating multiple materials and BOQ items sequentially causes significant latency. Atomic `bulkWrite` with aggregation pipelines for conditional stock clamping is significantly more efficient and prevents race conditions.
**Action:** Always prioritize `bulkWrite` and `Promise.all` in complex creation flows that update multiple related models. Use aggregation pipelines within `updateOne` or `bulkWrite` for atomic, logic-based updates (like clamping `currentStock` to a minimum of 0) to avoid redundant read-modify-write cycles.

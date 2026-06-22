## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-22 - Optimizing DPR Creation with Atomic Operations and Bulk Writes
**Learning:** The `createDPR` controller suffered from multiple performance bottlenecks: full hydration of large `Project` documents, N+1 query patterns for material stock updates, and redundant database roundtrips for linking records. Additionally, read-modify-save patterns were prone to race conditions.
**Action:** Use `Project.exists()` for validation, `Material.bulkWrite` for batching updates, and consolidated `Project.updateOne` with atomic operators (`$push`, `$inc`) to ensure thread safety and minimize latency.

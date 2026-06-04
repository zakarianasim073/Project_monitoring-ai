## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-04 - Optimizing createDPR with bulkWrite and Parallelization
**Learning:** Sequential database operations in controllers with many side-effects (like `createDPR`) create significant latency bottlenecks. Combining `Promise.all` for independent writes with `Material.bulkWrite` using an aggregation pipeline allows for atomic updates with complex logic (like stock capping) while reducing roundtrips from O(N) to O(1).
**Action:** Parallelize independent side-effects with `Promise.all` and use `bulkWrite` with aggregation pipelines for multi-document updates that require conditional logic.

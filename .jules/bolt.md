## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-30 - Optimizing createDPR with Atomic Operations and Parallelism
**Learning:** The createDPR controller was a performance bottleneck due to sequential execution of multiple database operations and heavy document hydration. Combining hydration avoidance (Project.exists), atomic operators (, $push), bulk operations (Material.bulkWrite), and parallelism (Promise.all) significantly reduces latency and ensures data consistency by avoiding race conditions.
**Action:** Always look for opportunities to parallelize independent sub-resource updates and use atomic aggregation pipelines for conditional updates like stock clamping.

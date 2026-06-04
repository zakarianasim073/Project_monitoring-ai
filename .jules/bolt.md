## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-04 - Optimizing createDPR with Parallelization and BulkWrite
**Learning:** Sequential await calls for independent database operations (DPR creation, BOQ updates, Material stock changes) create unnecessary latency. Additionally, parallelizing validation checks with mutations can lead to orphaned records if validation fails after a mutation has already started.
**Action:** Use `Promise.all` to parallelize independent operations *after* critical validation steps. Implement `bulkWrite` with aggregation pipelines for atomic, hydration-free updates to multiple related documents.

## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-04 - Optimizing createDPR with parallelization and bulkWrite
**Learning:** Controllers triggering multiple side-effects (like creating a DPR, updating BOQ, deducting stock, and creating liabilities) suffer from high latency when executed sequentially. Hydrating the root aggregate (Project) just to push IDs into arrays is a major memory and CPU bottleneck.
**Action:** Parallelize independent operations with `Promise.all`, use `Material.bulkWrite` with aggregation pipelines for conditional stock updates in a single roundtrip, and use `Project.updateOne({ $push: ... })` to avoid hydrating large sub-document arrays.

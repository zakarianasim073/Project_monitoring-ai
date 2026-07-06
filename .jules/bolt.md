## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2025-05-20 - High-Performance DPR Creation Pattern
**Learning:** In complex controllers like `createDPR` that interact with multiple models (BOQ, Material, Liability), sequential `await` calls and loops for stock updates introduce significant latency. Using `Material.bulkWrite` with aggregation pipelines allows for atomic stock management without fetching documents, and `Promise.all` parallelizes independent operations while `Project.updateOne` with `$push` avoids the overhead of hydrating the massive Project aggregate.
**Action:** Parallelize independent model operations and use atomic bulk operations (`bulkWrite`, `updateOne` with `$inc` / `$push`) to maximize throughput for aggregate-heavy controllers.

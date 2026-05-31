## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-20 - Advanced Atomic Updates with Aggregation Pipelines
**Learning:** Using aggregation pipelines within `updateOne` or `bulkWrite` (MongoDB 4.2+) enables complex atomic logic, such as clamping values with `$max` or handling nulls with `$ifNull`, directly on the database server. This eliminates the "fetch-calculate-save" cycle, preventing race conditions and avoiding the performance cost of hydrating Mongoose documents for simple updates.
**Action:** Prioritize atomic aggregation pipelines for resource consumption and stock updates to ensure data integrity and maximize throughput in high-concurrency controllers.

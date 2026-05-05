## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-12 - Atomic Multi-Field Updates with Aggregation Pipelines
**Learning:** High-concurrency routes like DPR creation and Material receipt are prone to race conditions and performance bottlenecks when using Mongoose's hydration-based `.save()`. Complex logic such as weighted averages and stock clamping (ensuring stock doesn't go below zero) can be offloaded to the database using aggregation pipelines within `findOneAndUpdate` or `bulkWrite`.
**Action:** Use aggregation pipelines in updates to perform atomic calculations and conditional logic (e.g., `$max` for zero-clamping, `$divide` for averages) in a single database roundtrip.

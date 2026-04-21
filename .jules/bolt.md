## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-04-21 - Optimized DPR Creation with Atomic Updates and Bulk Writes
**Learning:** Sequential `.save()` calls on multiple models within a loop (like material stock updates) and heavy hydration of aggregate root models (like `Project`) are significant bottlenecks. Bypassing Mongoose's document hydration via `lean()` and `exists()`, and using `bulkWrite` for multi-document updates, drastically reduces database latency and memory footprint.
**Action:** Use `bulkWrite` with aggregation pipelines for complex atomic updates (e.g., zero-clamping) and consolidate multiple parent-document updates into a single `updateOne` with `$push`.

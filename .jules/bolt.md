## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-04-29 - Atomic Stock Clamping and Consolidated Aggregate Updates
**Learning:** N+1 query loops for material stock updates can be eliminated using `bulkWrite` with an aggregation pipeline that handles atomic clamping (e.g., ensuring stock doesn't go below zero) in a single database roundtrip. Additionally, multiple `$push` operations to the same document should be consolidated into a single `updateOne` call to minimize write locks and network overhead.
**Action:** Implement `bulkWrite` with `$max` in aggregation pipelines for stock management and accumulate sub-document ID updates into a single `projectUpdates` object for a single `Project.updateOne` call.

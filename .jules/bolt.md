## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-18 - Parallelizing Root Aggregate Updates
**Learning:** When a controller needs to create new documents and link them to a root aggregate (e.g., `Project`), pre-generating `_id` values (e.g., `new mongoose.Types.ObjectId()`) for the new documents allows the aggregate's `$push` update to be parallelized with the `.save()` calls using `Promise.all`. This significantly reduces request latency by avoiding sequential await chains.
**Action:** Pre-generate ObjectIds for new documents to enable parallel root aggregate updates via `Promise.all`.

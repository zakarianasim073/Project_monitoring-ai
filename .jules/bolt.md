## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-26 - Optimized DPR creation with Parallelism and Bulk Operations
**Learning:** Consolidating multiple sequential database operations (save calls, N+1 loops) into parallelized tasks and bulk writes significantly reduces API latency. Using aggregation pipelines in updates allows for atomic conditional logic (like stock clamping) without fetching data into memory.
**Action:** Always look for opportunities to use `Promise.all` for independent tasks and `bulkWrite` with aggregation pipelines for multi-document updates that require logic.

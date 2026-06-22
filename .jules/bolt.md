## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-22 - Optimizing createDPR with Parallelism and Bulk Operations
**Learning:** The `createDPR` controller was performing multiple sequential `findById` and `save` operations, leading to significant latency. Consolidating sub-document updates into `bulkWrite` and `updateOne` with `$push`/`$inc` reduces database roundtrips. Furthermore, parallelizing independent operations (BOQ updates, Material stock, and Subcontractor lookups) using `Promise.all` significantly improves response times for complex transactions.
**Action:** Always look for opportunities to parallelize independent database operations and consolidate related project-level updates (like linking IDs to multiple arrays) into a single atomic operation.

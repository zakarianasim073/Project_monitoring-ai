## 2025-05-14 - Atomic Database Operations & Parallelism
**Learning:** Sequential `.save()` calls in a loop create a significant bottleneck due to multiple database round-trips. Using `bulkWrite` with atomic operators like `$inc` and `$push` is much faster. Also, Mongoose generates `_id` on the client-side, so you can parallelize a document's `.save()` with other operations that reference its ID.
**Action:** Always prefer `bulkWrite` for batch updates and `Promise.all` to execute independent database operations in parallel.

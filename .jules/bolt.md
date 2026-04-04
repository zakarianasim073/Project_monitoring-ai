## 2025-05-15 - DPR Creation Parallelization and Batching
**Learning:** Sequential database operations and N+1 query patterns significantly increase request latency. Mongoose generates document `_id`s locally upon instantiation, allowing for the parallelization of `.save()` operations alongside other database calls.
**Action:** Use `Promise.all` for independent database writes and `bulkWrite` for atomic batch updates to reduce round-trips.

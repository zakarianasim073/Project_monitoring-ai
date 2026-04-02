## 2025-05-14 - Batch and Parallelize Database Operations
**Learning:** Sequential `await` calls for independent database operations and loops of `save()` calls are significant latency bottlenecks. Mongoose generates `_id` locally, allowing parallelization of parent and child document creation. Atomic `$inc` and `bulkWrite` reduce round-trips and memory overhead.
**Action:** Always look for opportunities to use `Promise.all` for independent DB tasks and replace sequential updates with `updateMany` or `bulkWrite`.

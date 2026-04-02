## 2025-05-14 - Batch and Parallelize Database Operations
**Learning:** Sequential `await` calls for independent database operations and loops of `save()` calls are significant latency bottlenecks. Mongoose generates `_id` locally, allowing parallelization of parent and child document creation. Atomic `$inc` and `bulkWrite` reduce round-trips and memory overhead.
**Action:** Always look for opportunities to use `Promise.all` for independent DB tasks and replace sequential updates with `updateMany` or `bulkWrite`.

## 2025-05-14 - MongoDB URI Encoding
**Learning:** Special characters in MongoDB passwords (e.g., '@', '>', '<') can cause `EBADNAME` or SRV lookup errors if not URL-encoded.
**Action:** Use a `safeEncode` helper to automatically encode the password segment of the `MONGO_URI`.

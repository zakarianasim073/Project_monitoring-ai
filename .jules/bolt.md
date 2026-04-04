## 2025-05-15 - DPR Creation Parallelization and Batching
**Learning:** Sequential database operations and N+1 query patterns significantly increase request latency. Mongoose generates document `_id`s locally upon instantiation, allowing for the parallelization of `.save()` operations alongside other database calls.
**Action:** Use `Promise.all` for independent database writes and `bulkWrite` for atomic batch updates to reduce round-trips.

## 2025-05-15 - MongoDB URI Password Encoding
**Learning:** Special characters in the MongoDB password segment of an SRV connection string (e.g., '@', '>') can cause misparsing and `EBADNAME` errors during DNS SRV lookups if not URL-encoded.
**Action:** Use a `safeEncode` helper to URL-encode the password segment of the `MONGO_URI` before connecting.

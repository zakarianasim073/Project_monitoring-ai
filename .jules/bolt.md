## 2025-05-15 - [Optimized DPR Creation]
**Learning:** Sequential database operations (`findById` -> `save`) in loops create significant latency. Using atomic operators (`$inc`, `$push`) and batch operations (`bulkWrite`) eliminates round-trips and ensures data consistency without needing manual transaction management for simple increments. Parallelizing independent tasks with `Promise.all` further reduces response time.
**Action:** Always prefer atomic operators and `bulkWrite` for updates in loops. Use `Promise.all` for independent database tasks.

## 2025-05-15 - [Robust MongoDB URI Parsing]
**Learning:** MongoDB passwords with special characters (like '@' or '>') cause `EBADNAME` or SRV lookup errors if not URL-encoded. Parsing the URI by finding the *last* '@' symbol correctly identifies the host separator, even if the password contains '@'. Using `encodeURIComponent(decodeURIComponent(str))` ensures string is encoded exactly once.
**Action:** Use a `safeEncode` pattern and split URI by the last '@' to handle credentials safely.

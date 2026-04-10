## 2025-05-14 - Optimized Bill Creation & BOQ Distribution
**Learning:** Sequential `.save()` calls within a loop (N+1 problem) and full document hydration for existence checks are major performance bottlenecks in Mongoose. Atomic updates using `updateMany` with `$inc` or `$push` reduce database round-trips from O(N) to O(1).
**Action:** Use `Model.exists()` for validation, `updateOne` with `$push` for parent updates, and `updateMany` with `$inc` for batch updates to avoid hydration and sequential I/O.

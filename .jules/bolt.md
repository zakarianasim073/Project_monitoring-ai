## 2025-05-22 - Optimized Bill Creation and BOQ Distribution
**Learning:** Sequential `save()` calls within loops create significant latency overhead due to multiple database round-trips. Atomic updates using `$inc` and `$push` within `updateMany` or `updateOne` combined with `Promise.all` can reduce N+X operations to constant time (O(1) round-trips relative to item count).
**Action:** Always refactor loop-based `save()` operations to use bulk operators (`updateMany`, `bulkWrite`) and parallelize independent Mongoose operations with `Promise.all`.

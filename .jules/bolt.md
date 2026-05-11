## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-07-29 - Atomic Stock Clamping with bulkWrite
**Learning:** Updating material stock individually in a loop is an N+1 bottleneck. Furthermore, implementing "clamping" (e.g., ensuring stock doesn't go below zero) usually requires a read-before-write, which is prone to race conditions.
**Action:** Use `Material.bulkWrite` with an aggregation pipeline update. This allows using `$max: [0, ...]` to clamp values atomically on the database server in a single roundtrip, eliminating both the N+1 problem and the race condition.

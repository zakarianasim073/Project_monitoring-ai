## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-27 - Atomic Material Stock Clamping and Parallel Controller Tasks
**Learning:** Updating material stock in a loop with individual `.save()` calls is a major performance bottleneck for DPR creation. Additionally, using `Math.max(0, ...)` in JavaScript is not thread-safe for high-concurrency updates.
**Action:** Use `Material.bulkWrite` with an aggregation pipeline to atomically clamp `currentStock` at 0 using `$max` directly in MongoDB. Parallelize all independent database operations (validation, saves, bulk writes) using `Promise.all` to minimize response latency.

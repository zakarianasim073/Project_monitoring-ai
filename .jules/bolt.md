## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-04-24 - Atomic Stock Clamping and Bulk Updates in DPRs
**Learning:** Performing material stock updates in a loop with individual `.save()` calls is an N+1 anti-pattern. Furthermore, client-side logic for clamping (e.g., `Math.max(0, stock - qty)`) is prone to race conditions if not performed atomically.
**Action:** Use `Material.bulkWrite` with an aggregation pipeline update (`$set` with `$max` and `$subtract`) to perform atomic, multi-document stock updates in a single database roundtrip, ensuring data integrity and significantly reducing latency.

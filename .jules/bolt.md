## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-22 - Atomic Stock Clamping and N+1 Resolution
**Learning:** Sequential Material updates in a loop create an N+1 bottleneck. Additionally, manual read-modify-write for stock clamping (e.g., `Math.max(0, stock - qty)`) is prone to race conditions.
**Action:** Use `Material.bulkWrite` with an aggregation pipeline update (`$set` using `$add`, `$max`, and `$subtract`) to perform atomic stock updates while clamping values at zero, eliminating N+1 overhead and ensuring data integrity in a single database roundtrip.

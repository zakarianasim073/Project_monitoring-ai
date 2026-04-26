## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-21 - Atomic Stock Clamping with bulkWrite
**Learning:** In high-concurrency environments, the read-modify-save pattern for stock updates leads to race conditions and N+1 query overhead. Standard `$inc` isn't enough when logic like "clamp stock at zero" is required.
**Action:** Use `Material.bulkWrite` with an aggregation pipeline update (`$set` using `$max` and `$subtract`) to perform atomic, conditional updates in a single database roundtrip without hydrating models.

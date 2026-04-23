## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-04-18 - Atomic Stock Updates and N+1 Mitigation in DPR
**Learning:** In high-frequency controllers like `dprController`, updating multiple related entities (Materials, BOQ items) in loops with `.save()` causes significant latency due to N+1 database roundtrips. Furthermore, using manual JS logic for stock clamping (`Math.max(0, currentStock - usage)`) is prone to race conditions and requires full document hydration.
**Action:** Use `Material.bulkWrite` with an aggregation pipeline (`$set` with `$max` and `$subtract`) to perform atomic, conditional updates directly in the database. Combine all parent document updates into a single `updateOne` call to minimize roundtrips.

## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-15 - Atomic Multi-Document Updates and Stock Clamping
**Learning:** Manual stock updates in a loop (`findById` + `save`) are not only slow (N+1) but also prone to race conditions and lack atomic clamping logic (like `Math.max(0, ...)`). Using `bulkWrite` with an aggregation pipeline allows for complex atomic updates (e.g., `$max: [0, { $subtract: ["$currentStock", qty] }]`) to be executed in a single database roundtrip.
**Action:** Favor `bulkWrite` with aggregation pipelines for complex, batched atomic updates to ensure consistency and maximize performance.

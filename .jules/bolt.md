## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2025-05-16 - Atomic Stock Clamping with Aggregation Pipelines
**Learning:** When performing bulk updates on material stock, simple `$inc` can lead to negative values if not validated. However, fetching each document to check stock (N+1) is slow. MongoDB aggregation pipelines within `bulkWrite` allow for atomic logic like `$max: [0, { $subtract: ['$currentStock', usage.qty] }]` directly on the server.
**Action:** Use `Material.bulkWrite` with an aggregation pipeline to atomically update and clamp values in a single database roundtrip, avoiding hydration and race conditions.

## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-20 - Atomic Stock updates with bulkWrite
**Learning:** For inventory updates that require complex logic like stock clamping at zero, using `bulkWrite` with an aggregation pipeline (`[ { $set: { ... } } ]`) allows performing these operations atomically in a single roundtrip, eliminating N+1 query patterns while ensuring data integrity.
**Action:** Implement `Model.bulkWrite` with aggregation pipelines for batch updates that require conditional or calculated logic (e.g., `$max`, `$subtract`).

## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-07-20 - Atomic Stock Clamping with bulkWrite
**Learning:** Clamping values (e.g., ensuring stock doesn't go below zero) usually requires fetching the document, but this introduces race conditions and hydration overhead. Mongoose aggregation pipelines within updates allow for atomic server-side logic.
**Action:** Use `bulkWrite` with an aggregation pipeline and `$max` (e.g., `[{ $set: { field: { $max: [0, { $subtract: ["$field", val] }] } } }]`) to perform atomic, high-performance batch updates with conditional clamping.

## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-15 - Atomic Multi-Document Updates with bulkWrite
**Learning:** Sequential updates in a loop (N+1) are extremely slow and prone to race conditions. Mongoose's `bulkWrite` combined with aggregation pipelines allows for complex, conditional logic (like stock clamping with `$max`) to be executed atomically in a single database roundtrip.
**Action:** Replace loops of `.save()` with `bulkWrite` and use aggregation pipelines within the update block for logic that depends on existing document state.

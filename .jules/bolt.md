## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2025-05-20 - Batching Heterogeneous Updates with bulkWrite
**Learning:** While `updateMany` is great for applying the same change to multiple documents, `createDPR` required updating different materials with different quantities. Using a sequential loop created an N+1 bottleneck.
**Action:** Use `Model.bulkWrite()` to batch multiple different `updateOne` operations into a single database roundtrip. Combine this with an aggregation pipeline in the `update` field to perform complex atomic logic (like stock clamping with `$max`) across the batch.

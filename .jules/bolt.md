## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2025-05-16 - Atomic Bulk Updates with Clamping
**Learning:** When performing bulk updates where each document requires a different update value (e.g., deducting varying material quantities), `Model.updateMany` is insufficient. Furthermore, using a loop with `findById` and `save()` is a performance killer. Using `Model.bulkWrite` combined with an aggregation pipeline update allows for atomic calculations (like `$max` for zero-clamping) and eliminates N+1 database roundtrips.
**Action:** Use `Model.bulkWrite` with `updateOne` and an aggregation pipeline `update: [{ $set: { ... } }]` to perform complex atomic updates across multiple documents in a single request.

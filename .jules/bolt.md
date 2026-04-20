## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2025-05-20 - Atomic Stock Updates with Zero-Clamping
**Learning:** In high-concurrency environments, using `findById` followed by application-level logic (like `Math.max(0, stock - qty)`) and `save()` leads to race conditions and N+1 query overhead. MongoDB aggregation pipelines within `updateOne` or `bulkWrite` allow for atomic, conditional updates that are both faster and safer.
**Action:** Use `bulkWrite` with an aggregation pipeline `[{ $set: { field: { $max: [0, { $subtract: ["$field", value] }] } } }]` to perform atomic updates with lower-bound clamping.

## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2025-05-19 - Consolidating Project Updates and Atomic Stock Clamping
**Learning:** Performing multiple `.save()` calls on a document like `Project` results in redundant database roundtrips and repeated full-document hydration. Furthermore, implementing logic like `Math.max(0, stock - used)` in JavaScript is vulnerable to race conditions and requires a roundtrip.
**Action:** Use `Project.updateOne` with `$push: { $each: [...] }` to consolidate multiple updates into one. Use `bulkWrite` with aggregation pipelines (e.g., `$set: { currentStock: { $max: [0, { $subtract: [...] }] } }`) to perform complex, conditional updates atomically on the database server.

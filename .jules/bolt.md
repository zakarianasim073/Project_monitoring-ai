## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2025-05-16 - Atomic Stock Clamping with Aggregation Pipelines
**Learning:** In high-concurrency environments like DPR creation, fetching a document to calculate new stock levels and then saving it leads to race conditions. Additionally, using `Math.max(0, ...)` in JS doesn't protect the database from concurrent subtractions that might result in negative stock.
**Action:** Use `bulkWrite` with an aggregation pipeline update to perform atomic subtractions and use `$max: [0, { $subtract: [...] }]` to ensure numeric fields never drop below zero at the database level.

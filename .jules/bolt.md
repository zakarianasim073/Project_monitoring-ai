## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-01 - Atomic Stock Clamping with bulkWrite
**Learning:** In MongoDB/Mongoose controllers, updating stock across multiple materials usually triggers N+1 queries if using `save()`. Using `bulkWrite` with an aggregation pipeline allows for atomic updates and clamping (e.g., ensuring stock doesn't go below zero) in a single database roundtrip without needing to fetch the documents first.
**Action:** Use `Model.bulkWrite` with `$set` and aggregation operators like `$max`, `$subtract`, and `$ifNull` for multi-document stock updates with business logic clamping.

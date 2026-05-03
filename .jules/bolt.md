## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-12 - Atomic Stock Clamping with BulkWrite
**Learning:** Updating material stock in a loop with `findById` and `save()` creates an N+1 query bottleneck. Performing these updates atomically while clamping values at zero (e.g., currentStock cannot be negative) requires an aggregation pipeline within the update operation to avoid race conditions and multiple roundtrips.
**Action:** Use `Model.bulkWrite()` with an aggregation pipeline update (`$set` with `$max`, `$subtract`, etc.) to process multiple stock adjustments in a single database call with server-side logic.

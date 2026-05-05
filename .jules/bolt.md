## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-25 - Atomic Weighted Average and Bulk Clamping
**Learning:** Weighted average calculations and stock clamping (preventing negative stock) are prone to race conditions and N+1 query patterns when handled in application logic with .save(). Using Mongoose aggregation pipelines within findOneAndUpdate and bulkWrite allows these operations to be performed atomically and efficiently by the database engine.
**Action:** Prefer aggregation pipelines (, , , , ) for numeric state updates that depend on current values.

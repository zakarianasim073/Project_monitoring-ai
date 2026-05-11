## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-11 - Optimizing DPR Creation and Project Hydration
**Learning:** The `createDPR` handler previously suffered from multiple performance bottlenecks: hydrating the entire `Project` aggregate for a simple existence check, N+1 query loops for material stock updates, and redundant `.save()` calls. Using Mongoose hydration for large root aggregates like `Project` is extremely costly when only an existence check or a targeted array push is needed.
**Action:** Use `Project.exists()` for validation, `bulkWrite` with aggregation pipelines for atomic batch updates (ensuring stock clamping at zero), and consolidate all sub-document linking into a single `Project.updateOne` with `$push`.

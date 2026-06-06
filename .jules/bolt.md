## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-04 - Atomic Weighted Average and Bulk Stock Updates
**Learning:** Sequential fetch-modify-save cycles for material stock and weighted average calculations create significant latency and are prone to race conditions. The `Project` model hydration overhead further exacerbates this when using `findById`.
**Action:** Use `findOneAndUpdate` with aggregation pipelines for atomic arithmetic (like weighted averages) and `Material.bulkWrite` for multi-document updates. Parallelize independent operations using `Promise.all` to minimize total request latency.

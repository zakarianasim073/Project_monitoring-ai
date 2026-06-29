## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-29 - Atomic Aggregation Pipelines and Bulk Operations
**Learning:** Sequential read-modify-write patterns (e.g., fetching a material, calculating a new weighted average in JS, then saving) are prone to race conditions and are less efficient. MongoDB aggregation pipelines in `findOneAndUpdate` and `bulkWrite` allow for atomic, conditional arithmetic directly in the database.
**Action:** Implement complex updates (like weighted averages or clamped stock levels) using aggregation pipelines within `findOneAndUpdate` or `bulkWrite`. Parallelize independent operations with `Promise.all` to further reduce latency.

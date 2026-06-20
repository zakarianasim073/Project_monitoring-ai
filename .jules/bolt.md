## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-20 - Atomic Aggregation Pipelines for Complex Updates
**Learning:** Performing complex state-dependent updates (like weighted averages) by fetching, calculating in JS, and saving leads to race conditions and incorrect results if the base value changes between read and write. Scoping updates to `projectId` for BOLA is also often missed in these patterns.
**Action:** Use `findOneAndUpdate` with an aggregation pipeline to perform calculations atomically on the database server. This ensures consistency and allows for complex logic (like weighted average) in a single roundtrip while enforcing security filters.

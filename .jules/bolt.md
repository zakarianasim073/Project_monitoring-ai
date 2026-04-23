## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-04-20 - Optimizing High-Frequency Controller Patterns
**Learning:** Atomic updates using `$inc` and `$max` (within aggregation pipelines) are significantly more efficient than the "fetch-modify-save" pattern, especially for high-frequency operations like stock updates in `createDPR`. Additionally, consolidating multiple side-effect updates (e.g., adding DPRs and Liabilities to a Project) into a single `updateOne` call reduces database roundtrips and avoids the overhead of partial document saves.
**Action:** Use `bulkWrite` for multi-document updates and combine `$push` operations into a single object for a final `Project.updateOne` call. Always use `.lean()` and `.select()` when only reading specific fields for calculation.

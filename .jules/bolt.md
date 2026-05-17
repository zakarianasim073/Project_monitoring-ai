## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2025-05-17 - Atomic Weighted Average in Aggregation Pipelines
**Learning:** Manual weighted average calculation (fetch -> calculate in JS -> save) is prone to race conditions and requires expensive document hydration. Using an aggregation pipeline within `findOneAndUpdate` allows for atomic calculations directly on the database server.
**Action:** Implement weighted average logic using `$divide`, `$add`, and `$multiply` within a `$set` stage in a `findOneAndUpdate` pipeline. Always scope sub-resource updates with `{ _id, project: projectId }` to ensure data integrity.

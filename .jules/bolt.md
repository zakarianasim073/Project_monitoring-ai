## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-16 - Atomic Stock Clamping with bulkWrite
**Learning:** Manual stock deduction in loops (findById + save) causes N+1 queries and is prone to race conditions that can result in negative stock. Using `Material.bulkWrite` with an aggregation pipeline allows for atomic updates and logic (like `Math.max(0, ...)` clamping) to be executed entirely within the database.
**Action:** Implement `bulkWrite` with an update pipeline using `$set`, `$subtract`, and `$max` for any multi-item inventory deductions to ensure consistency and performance.

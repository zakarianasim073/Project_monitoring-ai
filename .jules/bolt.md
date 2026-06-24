## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-24 - Atomic Clamped Arithmetic with Aggregation Pipelines
**Learning:** Deducting stock while ensuring it doesn't go below zero usually requires a read-modify-write pattern if done in application logic, which is slow and prone to race conditions. MongoDB's aggregation pipelines in updates allow for atomic, conditional arithmetic (e.g., using `$max` and `$subtract`) directly in the database.
**Action:** Use aggregation pipelines in `updateOne` or `bulkWrite` for atomic, clamped updates (like stock deduction) to eliminate the need for sequential read-modify-write logic and document hydration.

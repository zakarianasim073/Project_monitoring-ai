## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-29 - Atomic Complex Updates with Aggregation Pipelines
**Learning:** Simple `$inc` or `$set` operators are sometimes insufficient for complex updates (e.g., weighted average calculation or stock clamping) that depend on current document values. Using `findOneAndUpdate` or `bulkWrite` with an aggregation pipeline allows for atomic, conditional arithmetic directly in the database. This eliminates the need for sequential read-modify-write patterns that are prone to race conditions and N+1 overhead.
**Action:** Prefer `findOneAndUpdate([ { $set: { ... } } ])` for single documents and `bulkWrite` with `updateMany`/`updateOne` pipelines for batch operations requiring complex logic or clamping.

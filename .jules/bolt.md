## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-12 - Parallelizing Complex State Transitions in DPR Creation
**Learning:** Controllers that handle multiple side effects (updating BOQ, Materials, and Liabilities) often fall into a sequential await pattern. This serializes database roundtrips and significantly increases response time. Using `Promise.all` with atomic operators (`$inc`, `bulkWrite`) and scoping updates to `projectId` for BOLA provides a pattern for high-performance, secure transaction-like operations in Mongoose without the overhead of full document hydration.
**Action:** Always parallelize independent sub-resource updates and use `updateOne` with `$push`/`$set` on the parent aggregate as the final atomic step instead of multiple `.save()` calls on a hydrated document.

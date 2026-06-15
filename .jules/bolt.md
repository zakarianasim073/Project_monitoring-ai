## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-16 - Atomic Weighted Average and BOLA Protection
**Learning:** Updating complex state like weighted averages in JavaScript (`findById` -> calculate -> `save`) is not only slow due to document hydration but also prone to race conditions and calculation bugs (e.g., using updated counters for old value math).
**Action:** Use `findOneAndUpdate` with an aggregation pipeline to perform multi-field atomic updates. This allows using `$averageRate` and `$totalReceived` in expressions before they are updated in the same operation, ensuring mathematical correctness and BOLA protection via project-scoping in the query.

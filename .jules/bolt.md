## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-24 - Atomic Weighted Average via Aggregation Pipeline
**Learning:** Calculating weighted averages in JavaScript after fetching a document is prone to race conditions and carries high hydration overhead. MongoDB's `findOneAndUpdate` with an aggregation pipeline allows for multi-field updates that depend on the current document state (e.g., `totalReceived` and `averageRate`) to be executed atomically in one database roundtrip.
**Action:** Use `Model.findOneAndUpdate(query, [ { $set: { ... } } ])` with `$add`, `$multiply`, and `$divide` to perform complex state-dependent calculations at the database level.

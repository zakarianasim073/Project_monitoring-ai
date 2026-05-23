## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-23 - Atomic Stock Updates with bulkWrite
**Learning:** Updating multiple related documents (like material stock in a DPR) in a loop with `.save()` causes N+1 database roundtrips and is vulnerable to race conditions if not using atomic operators.
**Action:** Use `Model.bulkWrite()` with an aggregation pipeline (`[\{ $set: \{ ... \} \}]`) to perform multiple atomic updates in a single roundtrip. This allows using operators like `$max` and `$subtract` for logic like stock clamping directly in the database.

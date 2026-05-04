## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-15 - Re-optimizing createDPR for Aggregate Root efficiency
**Learning:** High-frequency routes like `createDPR` are prone to performance regressions where atomic updates ($inc, bulkWrite) and light validation (Project.exists) are reverted to heavy hydration (findById) and N+1 loops. Consolidating multiple array pushes into a single `updateOne` call further reduces database roundtrips for complex aggregate roots.
**Action:** Always use `bulkWrite` with aggregation pipelines for clamped numeric updates and consolidate parent document updates into single atomic calls.

## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-12 - Atomic Stock Clamping and Consolidated Updates
**Learning:** High-frequency handlers like `createDPR` are prone to performance regressions where atomic operations are reverted to heavy "fetch-modify-save" patterns. Loop-based updates on materials create N+1 query bottlenecks. Furthermore, sequential updates to a parent document (e.g., Project) cause redundant database roundtrips.
**Action:** Implement `bulkWrite` with aggregation pipelines for atomic, clamped stock updates. Consolidate multiple array pushes into a single `updateOne({ $push: { ... } })` call. Always use `exists()` for project validation to avoid hydrating massive sub-document arrays.

## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-25 - High-Performance DPR Creation and Parallel Execution
**Learning:** Sequential `await` calls in a complex controller (like `createDPR`) create a significant performance bottleneck. Even when database operations are necessary, they can often be parallelized. Furthermore, using an aggregation pipeline within `bulkWrite` allows for complex atomic updates (like stock clamping) that would otherwise require multiple roundtrips or race-prone application-level logic.
**Action:** Pre-generate ObjectIDs to allow parallel saves and atomic aggregate updates via `Promise.all`. Use `bulkWrite` with aggregation pipelines for atomic operations with conditional logic (e.g., `$max: [0, ...]` for non-negative stock).

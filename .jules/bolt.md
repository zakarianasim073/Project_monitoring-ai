## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-04-29 - Optimized DPR Creation with Atomic and Bulk Operations
**Learning:** The `createDPR` handler was a major bottleneck due to N+1 `Material` updates, heavy `Project` hydration, and sequential `Project.save()` calls. Atomic stock clamping with `$max` in a `bulkWrite` aggregation pipeline update allows for efficient, safe updates without fetching documents. Consolidating all `Project` modifications into a single `updateOne` call reduces roundtrips significantly.
**Action:** Use `bulkWrite` with aggregation pipeline for complex atomic updates (like stock clamping). Always consolidate sub-document ID pushes into a single `$push` operation on the parent aggregate. Use `.lean()` for lookups that don't require document methods.

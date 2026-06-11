## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-10 - Optimizing DPR Creation with Parallelization and Bulk Writes
**Learning:** In controllers like `createDPR` that perform multiple independent database operations (DPR save, BOQ update, Material stock deduction, Liability creation, Project association), sequential `await` calls and full `Project` hydration significantly increase response times. Furthermore, updating multiple materials in a loop creates an N+1 query problem.
**Action:** Use `Promise.all` to parallelize independent tasks, `Project.exists()` for fast validation, and `Material.bulkWrite` with aggregation pipelines for atomic, bulk updates to eliminate N+1 overhead and ensure non-negative stock levels.

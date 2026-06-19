## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-19 - Consolidated Aggregate Updates and N+1 Material Deductions
**Learning:** In controllers like `createDPR` where multiple related records (DPR, Liability) are created and must be linked to a root `Project` aggregate, multiple sequential `project.save()` or `Project.updateOne()` calls cause redundant database writes and lock contention. Furthermore, processing material usage in a loop results in N+1 write operations.
**Action:** Consolidate all project-level reference updates into a single atomic `Project.updateOne` using a dynamic `$push` object. Use `Material.bulkWrite` for multi-document stock updates to ensure all inventory changes are dispatched in a single batch.

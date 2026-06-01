## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-01 - Parallelizing Complex DPR Side-Effects
**Learning:** Controllers that trigger multiple automated side-effects (e.g., updating BOQ, material stock, and liabilities) can suffer from high latency if operations are sequential. Furthermore, the `Project` model's large sub-document arrays make `findById` extremely slow due to hydration.
**Action:** Use `Promise.all` with self-invoking async functions to parallelize independent side-effects, and leverage `Material.bulkWrite` with aggregation pipelines to perform atomic stock updates without N+1 queries. Always prefer `Project.exists()` for validation to avoid hydration overhead.

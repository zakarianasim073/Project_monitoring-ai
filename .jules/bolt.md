## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-12 - Parallelizing DPR Creation and Atomic Stock Deduction
**Learning:** Creating a DPR involved multiple sequential database operations (BOQ update, Material stock deduction, Liability creation, Project update), leading to high latency. Material stock deduction specifically suffered from an N+1 pattern when multiple materials were used.
**Action:** Use `Material.bulkWrite` with aggregation pipelines for atomic stock deduction and `Promise.all` to parallelize independent database tasks, reducing the round-trip count from O(N+M) to O(1) for most operations.

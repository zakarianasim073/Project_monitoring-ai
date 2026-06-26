## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-26 - Optimized DPR Creation with Atomic Operations and Parallelization
**Learning:** Sequential database operations in a Mongoose controller (e.g., updating BOQ items, Material stocks, and Project links one by one) create a significant performance bottleneck due to cumulative I/O latency. Additionally, using `findById` on aggregate root models like `Project` (which has large arrays) triggers heavy document hydration.
**Action:** Replace `findById` with `exists()` for validation, use `bulkWrite` with aggregation pipelines for atomic bulk updates (e.g., stock deduction with clamping), and parallelize independent writes using `Promise.all()` to minimize response time.

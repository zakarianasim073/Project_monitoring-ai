## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-25 - Parallelizing Independent Controller Operations
**Learning:** Sequential `await` calls for independent database operations (e.g., saving a DPR, updating BOQ quantities, and bulk-writing material stock) create unnecessary latency. Consolidating these into `Promise.all` significantly reduces total response time. Furthermore, using MongoDB aggregation pipelines within `updateOne` or `bulkWrite` allows for complex atomic logic (like clamping values or conditional increments) without multiple roundtrips or race conditions.
**Action:** Identify independent operations in controllers and parallelize them with `Promise.all`. Use aggregation pipelines for atomic updates that require logic like `Math.max(0, current - qty)`.

## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-12 - Atomic Material Stock Deductions in DPRs
**Learning:** Deducting material stock in a loop with individual `.save()` calls is a major bottleneck. Furthermore, standard atomic updates using `$inc` can lead to negative stock if not carefully guarded. Using `bulkWrite` with an aggregation pipeline allows for complex atomic logic, like ensuring stock never drops below zero using `$max`, without the overhead of document hydration or race-prone read-modify-write cycles. Parallelizing these atomic updates with `Promise.all` further minimizes latency.
**Action:** Implement `bulkWrite` with aggregation pipelines for complex atomic updates and wrap independent database tasks in `Promise.all` to reduce total request time.

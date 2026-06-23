## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-22 - Parallelizing Multi-Model Updates in DPR Creation
**Learning:** Creating complex entities like DPRs involves updating multiple related models (BOQ, Materials, SubContractors, Liabilities, and Projects). Sequential execution of these operations significantly increases latency. Additionally, using `bulkWrite` for material stock updates is essential when handling multiple items to avoid N+1 overhead.
**Action:** Use `Promise.all` to parallelize independent database operations and `bulkWrite` for any array-based updates to minimize the total request time.

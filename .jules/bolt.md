## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-20 - Latency Reduction in DPR Creation
**Learning:** Sequential database operations and full document hydration are the primary latency bottlenecks in construct-heavy controllers. Parallelizing independent operations with `Promise.all` and using `bulkWrite` for multi-document updates significantly improves response times.
**Action:** Always check if database operations (saves, updates) are independent and can be moved into a `Promise.all` block. Use `Project.updateOne` instead of `project.save()` to avoid unnecessary array hydration when linking resources.

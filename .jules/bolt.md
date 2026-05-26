## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-26 - Optimized Atomic Updates and Parallelism in createDPR
**Learning:** Sequential database operations and manual "hydrate-modify-save" patterns in complex controllers like createDPR create significant latency and are prone to race conditions. Using Promise.all for parallelism and bulkWrite with aggregation pipelines for atomic side effects (like stock clamping) reduces database roundtrips and improves reliability.
**Action:** Always prefer atomic operators ($inc, bulkWrite with pipelines) over document hydration for side effects. Explicitly type mixed promises as Promise<any> when using Promise.all to satisfy TypeScript.

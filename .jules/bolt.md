## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-25 - High-Performance DPR Automation with Parallelism and Atomic Pipelines
**Learning:** `createDPR` is the most database-intensive operation in the app, touching Project, DPR, BOQItem, Material, SubContractor, and Liability models. Sequential execution and "read-modify-write" patterns here create severe latency spikes. Atomic updates using aggregation pipelines (for stock clamping) and `Promise.all` for I/O parallelization are essential for scalability.
**Action:** Always parallelize independent Mongoose operations in controllers and use `bulkWrite` with aggregation pipelines for complex arithmetic (like stock deduction with floors) to avoid race conditions and N+1 overhead.

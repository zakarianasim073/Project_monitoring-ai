## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-31 - Atomicity and Concurrency in DPR Automation
**Learning:** High-concurrency endpoints like `createDPR` that touch multiple models (Project, Material, BOQ, Liability) suffer from "death by a thousand roundtrips". Using `Promise.all` for parallel lookups and `Material.bulkWrite` with aggregation pipelines for atomic stock updates (including clamping via `$max`) minimizes total latency and prevents race conditions.
**Action:** Parallelize independent lookups and use atomic bulk operations for multi-document updates instead of read-modify-save loops.

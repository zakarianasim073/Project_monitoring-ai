## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-12 - Performance Optimization for Complex Resource Creation
**Learning:** When creating a resource (like a DPR) that triggers multiple side effects (updating BOQ, deducting stock, creating liabilities, and linking to a parent Project), sequential `await` calls significantly increase latency. Furthermore, updating stock in a loop via `.save()` is highly inefficient and prone to race conditions.
**Action:** Parallelize dependency fetching with `Promise.all`. Pre-generate `_id` values for new documents to allow parallelizing their `.save()` calls with the parent aggregate's update. Use `Model.bulkWrite` with aggregation pipelines for atomic, clamped stock updates in a single roundtrip.

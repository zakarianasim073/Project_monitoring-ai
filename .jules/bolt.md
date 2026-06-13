## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-12 - Optimizing DPR Creation with Parallelism and Bulk Updates
**Learning:** In controllers like `createDPR` that perform multiple sub-resource updates (BOQ, Materials, Liabilities), sequential `await` calls create significant latency. Additionally, using `.save()` on the `Project` model repeatedly is expensive due to its size.
**Action:** Parallelize independent DB operations using `Promise.all`, use `Material.bulkWrite` for batch updates, and perform a single `Project.updateOne` with `$push` to link all new resource IDs at once.

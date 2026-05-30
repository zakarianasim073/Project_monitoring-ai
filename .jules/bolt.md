## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-18 - Latency Reduction in Automation-Heavy Controllers
**Learning:** Controllers like `createDPR` that trigger multiple automated side-effects (stock updates, BOQ increments, liability creation) suffer from high cumulative latency when database operations are sequential. Parallelizing independent updates via `Promise.all` while using atomic `$push` and `$inc` operators ensures consistency without the overhead of full document hydration.
**Action:** Always parallelize side-effect updates that don't depend on each other's results, and use hydration-free linking (e.g., `Project.updateOne({ $push: ... })`) to maintain low API response times.

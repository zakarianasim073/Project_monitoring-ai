## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-22 - Parallelizing Asynchronous Operations in Controllers
**Learning:** Even with atomic updates, sequential `await` calls in controllers like `createDPR` introduce unnecessary latency when operations are independent. Parallelizing `DPR.save()`, `BOQItem.updateOne()`, and `Material.bulkWrite()` significantly reduces the total response time.
**Action:** Use `Promise.all()` to fire independent database operations concurrently. Combine this with `bulkWrite` for N+1 problems and `updateOne` for project-level aggregate updates to achieve maximum efficiency.

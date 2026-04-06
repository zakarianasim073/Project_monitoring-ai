## 2025-05-15 - [Optimize inventory controller operations and imports]
**Learning:** Sequential `findById` calls and dynamic imports in controller handlers are major performance bottlenecks. Replacing them with `Promise.all` and static imports reduces request latency.
**Action:** Always parallelize independent database lookups and prefer static imports for models in the `backend/` service.

## 2025-05-15 - [Atomic update vs Fetch-Modify-Save]
**Learning:** Using `Model.updateOne` is more efficient than `findById` followed by `save()` as it avoids document hydration and reduces DB round-trips.
**Action:** Use atomic operators like `$set` (implicit in simple `updateOne`) or `$inc` for simple field updates when the full document isn't needed.

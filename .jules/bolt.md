## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-04-18 - Atomic Stock Updates and Consolidated Project Writes
**Learning:** Updating material stock in a loop with `findById` and `save` is a major N+1 bottleneck. Furthermore, multiple `save()` calls on a hydrated `Project` document (which contains large arrays) causes significant memory and I/O overhead. Race conditions can also lead to incorrect stock levels if multiple DPRs are processed simultaneously.
**Action:** Use `Material.bulkWrite` with an aggregation pipeline to perform atomic increments/decrements and clamp values (e.g., stock at zero) in a single roundtrip. Accumulate all parent document modifications into a single `Project.updateOne({ $push: { ... } })` call to avoid heavy hydration and redundant writes.

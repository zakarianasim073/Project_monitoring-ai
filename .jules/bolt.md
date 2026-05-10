## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-07-29 - Atomic Material Updates and Consolidated Project Linking
**Learning:** Material stock updates in the `createDPR` handler are a major bottleneck when handled in a loop with `findById` and `save`. Furthermore, multiple sequential `project.save()` calls on the same request create unnecessary database load.
**Action:** Use `Material.bulkWrite` with an aggregation pipeline to perform atomic updates and clamping (`$max: [0, ...]`) in a single roundtrip. Consolidate all project sub-document linking into a final `Project.updateOne` call with `$push` to minimize saves.

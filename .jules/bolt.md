## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-03-20 - High-Performance DPR Processing with Atomic Batching
**Learning:** DPR creation is a complex operation involving multiple side effects (BOQ updates, Material stock deduction, Liability creation). Standard Mongoose patterns using loops and `.save()` on hydrated documents create severe performance bottlenecks and race conditions.
**Action:** Implemented `Material.bulkWrite` with an aggregation pipeline to atomically clamp stock and update consumption in a single roundtrip. Consolidated all project-level ID linking into a single `Project.updateOne` call to bypass redundant document hydration and multiple writes.

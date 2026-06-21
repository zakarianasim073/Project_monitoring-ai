## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-22 - Optimizing DPR Creation with Atomic Batch Updates
**Learning:** The `createDPR` operation involved multiple sequential `save()` calls on different models (`DPR`, `BOQItem`, `Material`, `Liability`, and `Project`), leading to excessive database roundtrips and potential race conditions. Specifically, the material update loop was an N+1 pattern, and repeated `Project.save()` calls were hydrating large sub-document arrays multiple times.
**Action:** Use `Material.bulkWrite` for batch material updates, `updateOne` with `$inc` for atomic quantity adjustments, and consolidate all project-level state changes into a single `Project.updateOne` call with `$push`. This minimizes roundtrips and avoids the overhead of document hydration.

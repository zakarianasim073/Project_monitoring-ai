## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-20 - Atomic Bulk Stock Updates with Clamping
**Learning:** In scenarios requiring bulk updates to materials with business logic (like preventing negative stock), traditional loops with `.save()` are extremely slow due to sequential network roundtrips and document hydration. Using `bulkWrite` with an aggregation pipeline allows multiple complex updates to be executed atomically in a single database roundtrip.
**Action:** Use `Material.bulkWrite` with an aggregation pipeline `[ { $set: { currentStock: { $max: [0, { $subtract: ["$currentStock", qty] }] } } } ]` to ensure performance and data integrity simultaneously.

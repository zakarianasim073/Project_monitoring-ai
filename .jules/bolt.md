## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-04-21 - Atomic Value Clamping and Bulk Updates
**Learning:** Atomic updates using aggregation pipelines within `bulkWrite` or `updateOne` allow for complex logic like value clamping (e.g., ensuring `currentStock` never goes below zero) without a read-modify-write cycle. This is significantly faster than fetching each document, modifying it in JS, and calling `.save()`.
**Action:** Prefer `Material.bulkWrite()` with `$max: [0, { $subtract: [...] }]` for material consumption to ensure atomicity and high performance.

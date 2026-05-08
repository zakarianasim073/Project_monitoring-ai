## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-07-29 - Consolidating Root Aggregate Updates and Bulk Writing
**Learning:** In a root aggregate pattern (like the `Project` model), multiple sequential updates to different arrays (e.g., `dprs` and `liabilities`) trigger redundant document hydration and multiple database roundtrips. Additionally, processing material usage in a loop with `.save()` is an N+1 anti-pattern.
**Action:** Consolidate multiple sub-document links into a single `updateOne` with a multi-field `$push`. Use `bulkWrite` with update aggregation pipelines (e.g., `[{ $set: { currentStock: { $max: [0, { $subtract: ['$currentStock', qty] }] } } }]`) to handle logic like stock clamping atomically in one roundtrip.

## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-25 - Remediating Performance Regression in DPR Creation
**Learning:** High-performance patterns (atomic updates, hydration-free validation) tend to revert to inefficient patterns (loop-based save, findById) during routine maintenance. In `createDPR`, multiple sequential `save()` calls on the large `Project` document and N+1 material updates were re-introduced.
**Action:** Re-implemented `Project.exists()`, `Material.bulkWrite` with aggregation pipelines for stock clamping, and consolidated `Project.updateOne` to maintain O(1) database roundtrips regardless of input size.

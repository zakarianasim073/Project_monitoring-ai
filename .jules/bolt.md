## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-07-01 - Optimized DPR Creation and Atomic Stock Updates
**Learning:** Sequential processing in the DPR creation flow (material stock updates, BOQ updates, liability creation) caused unnecessary database roundtrips. Using `bulkWrite` with aggregation pipelines allows for atomic, calculation-aware updates (e.g., deducting stock with a floor of zero) without needing to fetch documents first.
**Action:** Use `Promise.all()` to parallelize independent database operations and `bulkWrite` with aggregation pipelines for complex atomic updates that depend on current field values.

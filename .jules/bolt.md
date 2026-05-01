## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-15 - Atomic Stock Updates and Array Consolidation
**Learning:** High-frequency controllers like `dprController.ts` often suffer from N+1 patterns when updating material stocks in loops. Traditional `findById` + `.save()` also risks race conditions. Additionally, performing multiple separate `Project` updates for DPRs and Liabilities causes redundant database roundtrips and array hydration.
**Action:** Implement `Material.bulkWrite` with aggregation pipelines for atomic stock clamping and consolidate all Project array pushes into a single `Project.updateOne` call.

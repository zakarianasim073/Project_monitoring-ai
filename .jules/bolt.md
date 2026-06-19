## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-19 - Optimizing DPR Creation and Reference Linking
**Learning:** `createDPR` in `dprController.ts` was a performance hotspot due to sequential "find-modify-save" cycles across multiple collections (BOQ, Materials, Liabilities). These operations were blocking each other, and using `Material.findById` in a loop created a classic N+1 problem.
**Action:** Use `Material.bulkWrite` for atomic batch updates to inventory and `Promise.all` to parallelize independent updates to BOQ items, Material stocks, and Project references. Consolidate multiple `$push` operations into a single `Project.updateOne` call.

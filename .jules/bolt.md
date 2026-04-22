## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.
## 2026-04-22 - Re-optimizing DPR creation
**Learning:** Performance regressions occur when previous optimizations (like using .exists() and bulkWrite) are overwritten or reverted. Complex document creation logic like DPRs, which touch Projects, Materials, and BOQ items, are prime targets for hydration bottlenecks and N+1 query patterns.
**Action:** Always verify if high-frequency controllers are using atomic operations (, ) and bulkWrite. Use single-trip Project updates for multiple child associations.

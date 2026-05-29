## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-20 - Atomic Weighted Average and BOLA Protection
**Learning:** Sequential "fetch-modify-save" patterns in controllers like `inventoryController.ts` are not only slower due to multiple roundtrips but are also prone to race conditions and calculation bugs (e.g., updating totals before average calculation). Furthermore, they often lack proper project-scoping, leading to BOLA vulnerabilities.
**Action:** Implement atomic updates using `findOneAndUpdate` with aggregation pipelines to handle complex math (like weighted averages) in a single database operation while enforcing project-scoping for security.

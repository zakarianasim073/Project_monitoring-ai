## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-25 - Atomic Bulk Updates for Material Inventory
**Learning:** Updating multiple material stock levels in a loop with individual `.save()` calls is a significant bottleneck and prone to race conditions. MongoDB aggregation pipelines within updates allow for atomic, conditional arithmetic (like `$max` for clamping) directly in the database.
**Action:** Use `Model.bulkWrite()` with aggregation pipeline updates to handle multiple stock deductions in a single roundtrip, ensuring atomicity and eliminating the need for sequential read-modify-write patterns.

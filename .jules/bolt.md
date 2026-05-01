## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-01 - Consolidating complex transaction-like operations in Mongoose
**Learning:** High-frequency controllers like `createDPR` that interact with multiple collections (Project, BOQItem, Material, Liability) are prone to performance degradation and race conditions when using the "fetch-modify-save" pattern.
**Action:**
1. Replace `findById` with `Project.exists` for faster existence checks on root aggregates.
2. Use `Material.bulkWrite` with aggregation pipelines for atomic, clamped stock updates to eliminate N+1 queries in loops.
3. Use `.lean()` for read-only lookups (e.g., SubContractor).
4. Consolidate multiple parent document updates into a single `updateOne` call using a dynamic `$push` object.

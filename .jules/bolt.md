## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-01 - Atomic Stock Clamping and Consolidated Updates in createDPR
**Learning:** High-frequency automation handlers like `createDPR` can suffer from N+1 query patterns and heavy hydration when updating multiple related entities (Materials, BOQItems, Liabilities). Atomic updates with `$inc` and `bulkWrite` with aggregation pipelines for stock clamping are significantly faster and more reliable than fetch-modify-save cycles.
**Action:** Use `Material.bulkWrite` with `$max` and `$subtract` for atomic stock clamping. Consolidate multiple project updates into a single `updateOne` call. Use `.lean()` for read-only lookups.

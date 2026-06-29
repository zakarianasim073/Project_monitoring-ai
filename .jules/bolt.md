## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-29 - Robust Atomic Stock Deductions
**Learning:** When using aggregation pipelines in `bulkWrite` or `findOneAndUpdate` to update document fields (like `currentStock` or `totalConsumed`), uninitialized fields (null/undefined) can break arithmetic operations. Using `$ifNull` within the pipeline ensures that calculations like `$subtract` or `$add` are performed against a default value (0), preventing updates from failing or resulting in `NaN`.
**Action:** Always wrap field references in `$ifNull: ["$fieldName", 0]` when performing arithmetic in MongoDB update pipelines to ensure robustness against uninitialized data.

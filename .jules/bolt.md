## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-04-18 - Atomic Material Stock Clamping in DPRs
**Learning:** Sequential .save() calls in a loop for material stock updates create N+1 query bottlenecks and are prone to race conditions. Additionally, simple subtraction can lead to negative stock if not handled carefully.
**Action:** Use Material.bulkWrite with an aggregation pipeline update to perform atomic updates across multiple materials. Use the $max operator within the pipeline to ensure currentStock never drops below zero (clamping).

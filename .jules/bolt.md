## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-15 - Addressing Performance Regression in DPR Controller
**Learning:** High-performance patterns (atomic updates, batching, hydration-free validation) in complex controllers like `createDPR` are prone to being reverted to inefficient "fetch-and-save" patterns during maintenance. This specifically affects nested updates (Material stock) and cross-document linking (BOQItem, Project).
**Action:** Always prefer `bulkWrite` with aggregation pipelines for stock clamping and `updateOne` with atomic operators to avoid race conditions and unnecessary hydration of large document arrays.

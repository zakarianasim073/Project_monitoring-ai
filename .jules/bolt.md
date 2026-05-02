## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-02 - Atomic Bulk Updates with Stock Clamping
**Learning:** Updating material stock in a loop using `findById` and `save()` is highly inefficient (O(N) database roundtrips). Furthermore, manual clamping (e.g., `Math.max(0, ...)` in JS) is not atomic and can lead to race conditions.
**Action:** Use `Model.bulkWrite` with an aggregation pipeline update. This allows performing complex logic (like `$max` for clamping and `$ifNull` for safety) atomically in a single roundtrip, even for multiple different documents.

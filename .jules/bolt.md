## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-05 - Atomic Stock Clamping and Weighted Average Accuracy
**Learning:** Updating stock in a loop with `Math.max(0, current - usage)` is an N+1 anti-pattern and prone to race conditions. Additionally, the weighted average calculation in `receiveMaterial` is frequently broken by incorrect ordering (updating `totalReceived` before calculating `oldTotalValue`).
**Action:** Implement `Material.bulkWrite` with an aggregation pipeline (`$set` using `$add`, `$max`, and `$subtract`) for atomic stock clamping in a single database roundtrip. Ensure weighted average logic calculates base values before incrementing totals.

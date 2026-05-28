## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-28 - Atomic Weighted Average and Validation Optimization
**Learning:** Using Mongoose aggregation pipelines within `findOneAndUpdate` allows for atomic updates of complex derived values (like moving averages) while preventing race conditions. Specifically, the manual weighted average calculation (`oldAvg * total + newBatch`) was prone to errors if `total` was updated prematurely in the JS thread. Additionally, `Project.exists()` significantly reduces overhead compared to `findById()` when validating parent aggregates with large sub-document arrays.
**Action:** Always prefer atomic aggregation pipelines for counter/average updates and use `exists()` for hydration-free validation of root aggregates.

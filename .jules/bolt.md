## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-20 - Atomic Weighted Average and Hydration-Free Updates
**Learning:** Manual weighted average calculations in application logic are prone to race conditions and mathematical errors if fields like `totalReceived` are updated prematurely. Additionally, hydrating large `Project` documents for simple validation adds unnecessary latency.
**Action:** Use `findOneAndUpdate` with an aggregation pipeline to perform atomic calculations (like weighted averages) directly in the database. Always use `Project.exists()` instead of `findById()` when only existence needs to be verified.

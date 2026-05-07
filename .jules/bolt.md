## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-07-28 - Atomic Weighted Average and Hydration Optimization
**Learning:** High-frequency inventory updates in `inventoryController.ts` were using a "fetch, modify, save" pattern that is prone to race conditions and unnecessary hydration of the large `Project` aggregate root. Additionally, updating `totalReceived` before calculating weighted average is a common logic flaw that regresses when handled in application code.
**Action:** Use `findOneAndUpdate` with an aggregation pipeline to perform atomic calculations (like weighted average) and updates in a single database roundtrip. Always use `Project.exists()` instead of `findById()` when only existence needs to be verified for this aggregate root.

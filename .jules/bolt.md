## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2025-05-22 - Atomic Weighted Average and Validation Optimization
**Learning:** In the `receiveMaterial` handler, a standard read-before-write pattern was causing both a race condition and a logic error in weighted average calculation (using the updated total instead of the previous total in the denominator). Additionally, `Project.findById` was used for existence checks, unnecessarily hydrating large sub-document arrays.
**Action:** Implement atomic `findOneAndUpdate` with an aggregation pipeline to compute weighted averages using mathematical correctness (`($oldAvg * $oldTotal + $newRate * $newQty) / ($oldTotal + $newQty)`) in a single step. Always prefer `Project.exists()` for simple presence checks.

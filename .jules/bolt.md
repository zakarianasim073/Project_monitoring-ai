## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-15 - Atomic Weighted Average and Hydration Optimization
**Learning:** Performing weighted average calculations in application logic with Mongoose's read-modify-write pattern is prone to race conditions and mathematical errors if the total quantity is updated before the rate calculation. Additionally, hydrating large documents for simple field updates like remarks is inefficient.
**Action:** Implement atomic `findOneAndUpdate` with an aggregation pipeline to handle complex math (like weighted averages) directly in MongoDB. Use `updateOne` for simple field updates and `Project.exists()` for validation to bypass document hydration overhead.

## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-08 - Atomic Weighted Average with findOneAndUpdate
**Learning:** Performing arithmetic calculations (like weighted averages) in application code after a fetch introduces race conditions and often leads to subtle logic bugs if using updated state for pre-update calculations. Mongoose `findOneAndUpdate` with an aggregation pipeline allows these calculations to happen atomically within the database.
**Action:** Use `findOneAndUpdate([ { $set: { ... } } ])` to perform complex conditional arithmetic atomically, ensuring data integrity without extra roundtrips or hydration.

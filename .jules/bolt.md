## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-03 - Atomic Weighted Average and Stock Updates
**Learning:** Hydrating a document just to update numerical fields (like stock) and calculating weighted averages in JavaScript is inefficient and prone to race conditions. The previous `receiveMaterial` implementation also had a subtle bug where it used the already-incremented `totalReceived` to calculate the old inventory value.
**Action:** Use `findOneAndUpdate` with an aggregation pipeline (`$set` with `$add`, `$multiply`, `$divide`) to perform atomic calculations directly in the database. This eliminates hydration overhead and ensures data integrity during concurrent updates.

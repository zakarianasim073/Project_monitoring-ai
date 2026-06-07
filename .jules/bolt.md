## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-07 - Atomic Multi-Material Updates and Weighted Average Pipelines
**Learning:** The `createDPR` and `receiveMaterial` endpoints suffered from hydration overhead and N+1 query problems. Using `Material.bulkWrite` for multiple updates and `findOneAndUpdate` with an aggregation pipeline for complex arithmetic (like weighted averages) eliminates the need to fetch documents into memory. This also prevents race conditions that occur with the "fetch-modify-save" pattern.
**Action:** Prioritize `bulkWrite` and aggregation pipelines for any operation involving multi-document updates or complex field arithmetic to ensure atomicity and peak performance.

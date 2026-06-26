## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-26 - Atomic Clamping and Concurrency in Material Updates
**Learning:** Sequential read-modify-write patterns (e.g., `findById` -> logic -> `save()`) in material stock updates are highly susceptible to "lost update" race conditions and incur significant N+1 overhead. While using `$inc` for performance allows temporary negative stock, it ensures total data integrity across concurrent requests.
**Action:** Replace material save loops with `Material.bulkWrite` using `$inc` operators to ensure atomicity and O(1) database roundtrips. Use aggregation pipelines in updates if strict clamping is required without sacrificing atomicity.

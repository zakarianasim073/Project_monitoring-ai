## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-31 - Atomicity and Aggregation in Resource Linking
**Learning:** In the `createDPR` path, sequential `.save()` calls on multiple resources (DPR, BOQItem, Materials, Liabilities) cause excessive database roundtrips and are prone to race conditions. Using `Material.bulkWrite` with an aggregation pipeline (`$max`, `$subtract`) allows for atomic, hydration-free stock updates with safety constraints (e.g., preventing negative stock) in a single operation.
**Action:** Parallelize independent side-effects using `Promise.all` and consolidate linking updates into a single `updateOne` using multiple atomic operators (`$push`, etc.) to minimize aggregate write overhead.

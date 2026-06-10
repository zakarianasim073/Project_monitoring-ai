## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-10 - Atomic Material Stock Updates with bulkWrite
**Learning:** Sequential `Material.findById` and `.save()` calls in a loop (N+1 anti-pattern) cause significant latency and are prone to race conditions in stock management. Using `Material.bulkWrite` with an aggregation pipeline (`$set` with `$add`, `$subtract`, and `$max`) allows for complex atomic updates (like preventing negative stock) in a single database roundtrip without hydrating the documents.
**Action:** Replace material update loops with `Material.bulkWrite` and use `Promise.all` to parallelize independent database operations (DPR save, BOQ increment, Material bulk update) to further reduce total request time.

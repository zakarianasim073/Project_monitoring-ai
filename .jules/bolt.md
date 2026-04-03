## 2025-05-15 - Optimized bill creation and distribution

**Learning:** Sequential `save()` calls in a loop cause an N+1 write problem, which significantly increases request latency as the number of items grows. Using `updateMany` with `$inc` handles this atomically and efficiently in a single database round-trip. Additionally, `Model.exists()` is faster than `findById()` for simple validation because it avoids document hydration, and `Promise.all` can be used to parallelize independent database writes like creating a record and updating its parent.

**Action:** Always prefer `updateMany` or `bulkWrite` for batch updates. Use `exists()` for validation and `Promise.all` for parallelizing independent operations.

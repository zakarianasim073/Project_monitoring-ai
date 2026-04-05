## 2025-05-15 - Optimizing Sequential Database Operations

**Learning:** Sequential `save()` calls in a loop (e.g., for BOQ distribution) create O(N) database round-trips, which significantly increases latency as N grows. Additionally, full document hydration via `findById` is unnecessary when only existence needs to be verified.

**Action:** Use `updateMany` with atomic operators like `$inc` to reduce O(N) operations to O(1). Prefer `Model.exists()` for validation to skip hydration overhead, and use `Promise.all()` to parallelize independent writes like saving a new document and updating its parent.

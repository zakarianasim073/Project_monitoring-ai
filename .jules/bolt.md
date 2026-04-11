## 2025-05-14 - Optimized DPR Creation with Parallelization and Atomic Updates
**Learning:** Sequential `findById` and `save` calls in a loop create a significant performance bottleneck (O(n) round-trips). Mongoose generates `_id` locally, allowing us to parallelize the creation of dependent documents with `Promise.all`. Furthermore, MongoDB aggregation pipelines within `updateOne` can perform atomic clamping (e.g., using `$max`) without fetching the document first.
**Action:** Always look for opportunities to replace fetch-then-save patterns with atomic `updateOne` calls, and parallelize independent database writes using `Promise.all`.

## 2025-05-14 - Deployment Fix for Robust MONGO_URI Parsing
**Learning:** Render dashboard environment variables can sometimes include trailing special characters or unencoded credentials that lead to `EBADNAME` errors during SRV lookups. A robust parsing strategy using `lastIndexOf('@')` and `encodeURIComponent` is required for reliable deployment across diverse environments.
**Action:** Use defensive URI parsing and sanitization for critical connection strings like `MONGO_URI` to prevent deployment failures caused by external configuration artifacts.

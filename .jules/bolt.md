## 2025-05-14 - Multi-level query optimization with .lean() and existence checks
**Learning:** High-frequency operations like authorization middleware benefit significantly from `.lean()` by skipping Mongoose document hydration. Parallelizing existence checks with `Promise.all` and using `Model.exists()` further reduces latency and overhead.
**Action:** Always use `.lean()` for read-only Mongoose queries and `Promise.all` to parallelize independent database lookups.

## 2025-05-14 - MongoDB URI Sanitization for Render Deployment
**Learning:** Special characters like `>` or `@` in the `MONGO_URI` password can cause `EBADNAME` errors during deployment if they are not URL-encoded, as the driver misparses the connection string.
**Action:** Implement robust URI sanitization that URL-encodes the password segment exactly once to handle special characters while preventing double-encoding.

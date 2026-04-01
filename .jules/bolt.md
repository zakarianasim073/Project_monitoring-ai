## 2025-05-14 - Multi-level query optimization with .lean() and existence checks
**Learning:** High-frequency operations like authorization middleware benefit significantly from `.lean()` by skipping Mongoose document hydration. Parallelizing existence checks with `Promise.all` and using `Model.exists()` further reduces latency and overhead.
**Action:** Always use `.lean()` for read-only Mongoose queries and `Promise.all` to parallelize independent database lookups.

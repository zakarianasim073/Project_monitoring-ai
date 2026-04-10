## 2025-05-15 - Optimizing Database Operations in DPR Creation
**Learning:** Sequential `findById` and `save` calls in loops create an N+1 database round-trip problem, significantly increasing latency. Combining independent operations into `Promise.all` and using `bulkWrite` with atomic operators like `$inc` reduces the total round-trips from ~15 to ~3.
**Action:** Always prefer `bulkWrite` or `updateMany` for batch updates and `Promise.all` for parallel execution of independent database operations.

## 2025-05-15 - Middleware Efficiency
**Learning:** High-frequency operations like RBAC middleware (`requireProjectRole`) benefit from `.lean()` to skip Mongoose document hydration, as the full Mongoose document is not needed for role verification.
**Action:** Use `.lean()` for read-only lookups in middlewares and hot paths.

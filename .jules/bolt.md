## 2025-05-15 - DPR Creation Optimization
**Learning:** Replaced sequential `await` calls and loops with `Promise.all` and `bulkWrite` for O(n) to O(1) database round-trip reduction.
**Action:** Always prefer atomic operators ($inc, $push) and bulk operations for batch updates to avoid Mongoose document hydration overhead and race conditions.

## 2025-05-15 - High-frequency Middleware Optimization
**Learning:** Adding `.lean()` to Mongoose queries in authorization middleware significantly reduces CPU overhead by skipping document instantiation for read-only checks.
**Action:** Use `.lean()` for all read-only queries, especially in middleware or high-traffic API endpoints.

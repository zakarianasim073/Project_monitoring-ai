## 2025-05-15 - Compound Indexing & Lean Queries
**Learning:** Performance in Mongoose-heavy applications is often bottlenecked by document hydration and inefficient lookups on foreign keys. Compound indexes on frequently queried combinations (like `user` and `project` in permissions checks) drastically reduce collection scans. Using `.lean()` for read-only operations skips the expensive process of creating Mongoose Document instances.
**Action:** Always check for missing indexes on foreign keys and use `.lean()` for read-only queries that don't require Mongoose methods.

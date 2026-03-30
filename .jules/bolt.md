## 2025-05-15 - [Optimized DPR Creation]
**Learning:** Sequential database operations (`findById` -> `save`) in loops create significant latency. Using atomic operators (`$inc`, `$push`) and batch operations (`bulkWrite`) eliminates round-trips and ensures data consistency without needing manual transaction management for simple increments. Parallelizing independent tasks with `Promise.all` further reduces response time.
**Action:** Always prefer atomic operators and `bulkWrite` for updates in loops. Use `Promise.all` for independent database tasks.

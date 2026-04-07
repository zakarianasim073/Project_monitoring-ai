## 2025-05-14 - Optimized Bill Creation and Distribution
**Learning:** Sequential database operations and "save-in-loop" patterns create significant latency, especially as data grows. Using `Model.exists()` for validation avoids hydration overhead, and atomic operators like `$inc` in `updateMany` eliminate N+1 query issues by delegating calculations to the database engine.
**Action:** Always prefer `Promise.all()` for independent database writes and leverage atomic MongoDB operators for bulk updates instead of fetching and saving documents individually.

## 2025-05-15 - DPR Creation Optimization and BOLA Prevention
**Learning:** Sequential await calls and document hydration (`findById`) in `dprController.ts` were causing high latency. Additionally, previous security fixes for BOLA/IDOR had regressed.
**Action:** Use `Project.exists` for fast validation, parallelize sub-tasks with `Promise.all`, and use atomic updates with aggregation pipelines for stock clamping. Always scope sub-resource lookups by `projectId`.

## 2026-06-07 - Optimization Regression in createDPR and receiveMaterial
**Learning:** Significant performance optimizations (bulkWrite, aggregation pipelines, avoiding full hydration) were previously implemented but appear to have been reverted or regressed. The current implementation suffers from N+1 query patterns and unnecessary heavy object hydration from the Project aggregate.
**Action:** Re-implement atomic bulk updates and parallelize database operations in `createDPR` to restore performance gains.

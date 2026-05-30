## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-30 - High-Concurrency DPR Processing Optimization
**Learning:** Sequential `findById` and `save()` calls in a loop (N+1 pattern) for material updates during DPR creation cause significant latency. Furthermore, manual array manipulation of large root aggregates like `Project` followed by `.save()` is a major bottleneck due to full document hydration and re-serialization.
**Action:** Replace sequential updates with `Model.bulkWrite` using aggregation pipelines for atomic, hydration-free updates. Use `Project.updateOne({ $push: ... })` to link sub-resources without loading the parent aggregate.

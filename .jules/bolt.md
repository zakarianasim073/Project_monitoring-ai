## 2026-04-10 - Atomic Distribution Pattern
**Learning:** Sequential `save()` loops for distributing amounts across multiple documents create N+1 database bottlenecks. Using `countDocuments()` to calculate the per-item share followed by a single `updateMany()` with `$inc` reduces latency from O(N) to O(1).
**Action:** Always prefer atomic `$inc` updates over manual calculation and sequential saves for mass updates.

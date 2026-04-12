## 2026-04-12 - Atomic Updates in Bill Distribution
**Learning:** Sequential `save()` calls in a loop (N+1 problem) can be replaced with `countDocuments()` followed by an `updateMany()` with `$inc` to achieve atomic, high-performance distribution across multiple documents.
**Action:** Always look for patterns where multiple documents of the same collection are being updated with a calculated value based on the total count; use `updateMany` with `$inc` instead of a loop.

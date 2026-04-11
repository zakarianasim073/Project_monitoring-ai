## 2026-04-10 - [N+1 Regression in Bill Distribution]
**Learning:** Sequential `save()` calls in a loop for BOQ item distribution cause N+1 database queries, significantly slowing down bill creation as the number of active items grows. This also leads to unnecessary document hydration for each item.
**Action:** Use `updateMany` with `$inc` to perform atomic, batch updates for all eligible items in a single query. Combine with `.exists()` for validation to avoid hydration on existence checks.

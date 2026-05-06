## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-06 - Atomic Weighted Average and Light Validation
**Learning:** In the inventory controller, calculating weighted averages using hydrated document state (findById + save) is vulnerable to race conditions and N+1 overhead. Using Project.exists() for validation and a single findOneAndUpdate with an aggregation pipeline ensures atomicity and eliminates the need to hydrate massive project/material documents.
**Action:** Always prefer atomic aggregation pipelines for numeric calculations involving state (like stock or averages) and use .exists() for simple existence checks.

## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-05-15 - Atomic Weighted Average & Regression Risk
**Learning:** Manual calculations of weighted averages in JS (e.g., in `receiveMaterial`) are prone to mathematical errors, especially when state is mutated before calculation. Furthermore, high-performance patterns (atomic updates, hydration-free validation) in this codebase frequently regress to inefficient `findById`/`.save()` patterns during routine maintenance.
**Action:** Always prefer atomic `findOneAndUpdate` with an aggregation pipeline for complex updates. This ensures mathematical correctness (all field expressions evaluate against the same pre-update state) and prevents "hydration bloat". Use project-scoping in the query to maintain BOLA protection.

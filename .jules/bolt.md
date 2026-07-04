## 2025-05-15 - Optimizing Bill Creation and BOQ Distribution
**Learning:** The `Project` model in this application acts as a root aggregate with many large sub-document arrays. Using `findById` triggers full hydration of these arrays, which is inefficient for simple existence checks. Additionally, updating BOQ items in a loop with `.save()` creates an N+1 query problem, significantly slowing down bill processing as the number of BOQ items grows.
**Action:** Use `Model.exists()` for presence validation and `updateMany` with atomic operators like `$inc` for bulk updates to eliminate N+1 overhead and minimize database roundtrips.

## 2026-06-12 - Atomic FindOneAndUpdate with Aggregation Pipelines
**Learning:** Fetch-then-save patterns for counters (like stock) cause race conditions. Complex calculations (like weighted average) are prone to bugs if done in application logic when multiple fields are being updated. Redundant `Project.findById` calls hydrate large documents unnecessarily when the `projectId` is already known and access is verified by middleware.
**Action:** Replace fetch-then-save with `findOneAndUpdate` using an aggregation pipeline. This allows performing complex math (weighted average) and increments (totalReceived) in a single atomic database operation. Remove redundant root aggregate lookups to reduce memory overhead and latency.

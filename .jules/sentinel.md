## 2026-07-29 - BOLA and Race Condition Regressions in inventoryController
**Vulnerability:** BOLA (Broken Object Level Authorization) and Race Conditions in material stock updates.
**Learning:** Manual hydration (`findById` followed by `save`) for stock updates is prone to race conditions and frequently regresses to unscoped lookups, bypassing project-level authorization.
**Prevention:** Always use project-scoped lookups (`findOne({ _id, project: projectId })`) and implement atomic updates using `findOneAndUpdate` with aggregation pipelines for complex calculations like weighted averages.

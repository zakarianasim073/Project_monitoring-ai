# Sentinel's Journal - Critical Security Learnings

## 2025-03-24 - Information Leakage and BOLA Regressions
**Vulnerability:** Information Leakage (exposing `error.message` in 500 responses) and Broken Object Level Authorization (BOLA) in resource lookups.
**Learning:** Security fixes in project-scoped routes and controllers are subject to frequent regressions. Developers often revert to using `findById(id)` for convenience, forgetting to scope the query to the `projectId`, and often default to returning raw error objects.
**Prevention:** Always verify project-scoping for sub-resource access (Material, Bill, etc.) and ensure a standardized generic error response pattern is used across all controllers. Use `grep` to audit for `error.message` leaks periodically.

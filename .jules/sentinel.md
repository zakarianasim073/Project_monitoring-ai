## 2026-06-10 - BOLA in Costing Analysis
**Vulnerability:** Broken Object Level Authorization (BOLA) in `analyzeItemCost` endpoint.
**Learning:** Using `findById` on sub-resources without scoping to the parent `projectId` allows cross-project data access if an attacker knows or guesses an ID.
**Prevention:** Always use `Model.findOne({ _id: id, project: projectId })` for sub-resource lookups in project-context routes.

## 2026-06-10 - Information Leakage in Error Responses
**Vulnerability:** Internal server errors leaked raw error messages to the client.
**Learning:** Returning `error.message` directly in 500 responses can expose database schemas, internal paths, or logic details.
**Prevention:** Standardize generic "Internal server error" messages for all 500 status codes in production-facing APIs, while logging the full error server-side.

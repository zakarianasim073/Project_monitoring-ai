## 2026-06-12 - [Critical] BOLA and Information Leakage in Project Controllers

**Vulnerability:** BOLA (Broken Object Level Authorization) and Information Leakage. Sub-resources like Materials, BOQItems, and SubContractors were being updated using `findById(id)` without verifying their association with the `projectId` from the route. Additionally, route handlers were returning `error.message` in 500 responses, leaking internal logic details.

**Learning:** Relying solely on global IDs for sub-resources within a multi-tenant or multi-project architecture creates a significant BOLA risk where a user authorized for one project can manipulate data in another by guessing or obtaining IDs.

**Prevention:** Always scope sub-resource lookups using both the resource ID and the parent project ID (e.g., `findOne({ _id: id, project: projectId })`). Standardize 500 error responses to return a generic 'Internal server error' to the client while logging the detailed error on the server for debugging.

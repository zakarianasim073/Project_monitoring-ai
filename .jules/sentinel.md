# Sentinel Security Journal

## 2025-03-24 - Broken Object Level Authorization (BOLA) in Sub-resource Controllers
**Vulnerability:** Sub-resources like Materials, SubContractors, and Bills were being accessed via `findById(id)` instead of being scoped to their parent Project. This allowed a user authorized for one project to potentially manipulate resources of another project if they knew the resource ID.
**Learning:** Even with project-level middleware checking access to `projectId`, individual resource lookups must still be scoped to that `projectId` to prevent IDOR/BOLA.
**Prevention:** Always use `findOne({ _id: id, project: projectId })` when fetching sub-resources within a project context.

## 2025-03-24 - Information Leakage via Error Messages
**Vulnerability:** Backend controllers were returning `error.message` directly in 500 Internal Server Error responses.
**Learning:** Returning raw error messages can leak sensitive information about the database schema, internal logic, or third-party integrations to potential attackers.
**Prevention:** Standardize 500 error responses to return a generic 'Internal server error' message while logging the actual error details server-side for debugging.

## 2026-06-10 - BOLA Hardening in DPR Creation
**Vulnerability:** Broken Object Level Authorization (BOLA) in `createDPR` controller.
**Learning:** Controllers often use `findById` for sub-resource lookups (Material, BOQItem, SubContractor) without validating that these resources actually belong to the `projectId` specified in the request.
**Prevention:** Always use `Model.findOne({ _id: id, project: projectId })` when looking up sub-resources within a project-scoped request to ensure strict data isolation and prevent cross-project data manipulation.

## 2026-06-10 - Generic Error Handling to Prevent Information Leakage
**Vulnerability:** Information leakage through verbose error messages in `dprController.ts`.
**Learning:** Returning `error.message` directly in the response can expose internal database structure, field names, or logic details to an attacker.
**Prevention:** Use generic error messages like 'Internal server error' in production responses, while logging the detailed error server-side for debugging.

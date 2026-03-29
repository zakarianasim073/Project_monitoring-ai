## 2025-05-15 - Broken Object Level Authorization (BOLA) in Project Controllers
**Vulnerability:** Insecure Direct Object Reference (IDOR/BOLA) where entities (Materials, BOQItems, SubContractors, Bills) were fetched using only their `_id` without verifying they belong to the `projectId` specified in the request.
**Learning:** Even with project-level RBAC middleware, controllers must still scope individual entity lookups to the project context to prevent cross-project data manipulation.
**Prevention:** Always use `Model.findOne({ _id: id, project: projectId })` instead of `Model.findById(id)` for entities that are scoped to a project.

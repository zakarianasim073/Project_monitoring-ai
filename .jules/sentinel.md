## 2026-06-12 - Broken Object Level Authorization (BOLA) in Resource Queries

**Vulnerability:** Multiple controllers (inventory, dpr, costing) were using `findById(id)` to retrieve sub-resources (Materials, BOQItems, SubContractors) without verifying that these resources actually belong to the project specified in the request URL. An attacker could potentially manipulate the ID in the request body to modify or access resources belonging to other projects.

**Learning:** Developers often assume that because a route is protected by project-level middleware (like `requireProjectRole`), all subsequent database queries within that route are implicitly safe. However, sub-resources linked via foreign keys must still be explicitly scoped to the parent project in every query to prevent cross-project data leakage or modification.

**Prevention:** Always use `findOne({ _id: id, project: projectId })` instead of `findById(id)` when querying resources that are owned by a Project. Ensure `projectId` is extracted from the route parameters and used as a mandatory filter in the database query.

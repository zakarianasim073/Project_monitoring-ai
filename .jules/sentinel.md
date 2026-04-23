## 2025-05-14 - BOLA in Inventory Controller
**Vulnerability:** Insecure Direct Object Reference (IDOR) via Broken Object Level Authorization (BOLA). `findById` was used for Material, SubContractor, and Bill models without checking the `project` field, allowing unauthorized cross-project access/modification.
**Learning:** Middleware like `requireProjectRole` only verifies project-level access; it doesn't automatically protect individual resources within the project if they are fetched using only their global ID.
**Prevention:** Always scope resource lookups to the `projectId` using `findOne({ _id: resourceId, project: projectId })` for all multi-tenant or project-scoped entities.

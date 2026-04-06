## 2025-05-14 - Broken Object Level Authorization (BOLA/IDOR) in Sub-resource Lookups

**Vulnerability:** Controller actions were fetching sub-resources (Material, BOQItem, SubContractor, Bill) using only their primary key (`findById`) without verifying their association with the `projectId` provided in the request context.

**Learning:** Authenticated users could potentially access or manipulate data belonging to other projects by guessing or providing IDs of resources not owned by their current project, even if they had a valid role for *some* project.

**Prevention:** Always scope sub-resource lookups by both the resource ID and the parent entity ID (e.g., `projectId`). Use `Model.findOne({ _id: resourceId, project: projectId })` instead of `findById(resourceId)`. Ensure all routes that expose project-specific data are protected by `requireProjectRole` middleware.

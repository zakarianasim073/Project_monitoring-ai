# Sentinel's Journal 🛡️

## 2026-06-15 - Fixing BOLA Vulnerabilities in Inventory Management
**Vulnerability:** Broken Object Level Authorization (BOLA). Routes were using `findById(id)` without verifying that the object belongs to the authorized `projectId`, allowing users to modify materials or bills from other projects if they knew the ID.
**Learning:** Even if a route is protected by `requireProjectRole(projectId)`, individual document lookups within the controller must still be scoped to that `projectId` to prevent cross-project data manipulation.
**Prevention:** Always use `Model.findOne({ _id: id, project: projectId })` or similar scoped queries when accessing sub-resources.

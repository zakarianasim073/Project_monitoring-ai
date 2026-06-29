## 2026-06-29 - BOLA via Unscoped Find
**Vulnerability:** Broken Object Level Authorization (BOLA) in inventory and costing controllers.
**Learning:** Controllers were using `findById` for sub-resources (Materials, BOQItems) while only verifying the user's access to the parent `Project`. This allowed users to access/modify resources in other projects if they knew the ID.
**Prevention:** Always scope sub-resource lookups to the `projectId` provided in the route parameters using `findOne({ _id: id, project: projectId })`.

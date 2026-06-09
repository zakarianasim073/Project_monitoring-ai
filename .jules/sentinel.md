## 2026-06-08 - BOLA Hardening in Sub-Resource Controllers
**Vulnerability:** Broken Object Level Authorization (BOLA/IDOR) in inventory and remark controllers.
**Learning:** Using `findById(id)` on sub-resources (like materials or bills) allowed users authorized for *any* project to potentially manipulate resources in *other* projects by guessing or providing their IDs, if the controller didn't explicitly check the resource's project ownership.
**Prevention:** Always scope sub-resource lookups to the `projectId` using `Model.findOne({ _id: id, project: projectId })` instead of `findById(id)`. Annotate these changes with `// SECURITY:` comments to preserve intent during future refactors.

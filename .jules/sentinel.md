## 2026-06-06 - BOLA vulnerability in inventoryController.ts
**Vulnerability:** The `receiveMaterial` and `updatePDRemarks` endpoints were using `findById(id)` without scoping to the `projectId`, allowing a user with a valid role in ONE project to potentially modify materials/bills/subcontractors in ANY project by providing the target item's ID.
**Learning:** Even with `requireProjectRole` middleware, sub-resource lookups must still be scoped to the parent resource (Project) to prevent Broken Object Level Authorization (BOLA).
**Prevention:** Always use `Model.findOne({ _id: id, project: projectId })` instead of `findById(id)` for resources that belong to a project.

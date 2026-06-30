## 2026-06-29 - BOLA in Project-Scoped Resources
**Vulnerability:** Broken Object Level Authorization (BOLA) across multiple controllers (Inventory, Costing, DPR).
**Learning:** Resource lookups using `.findById(id)` allowed users to access or modify items belonging to projects they might not have access to, provided they had a valid ID. The `projectId` from the route was often ignored during the actual database query for sub-resources.
**Prevention:** Always scope resource lookups to the `project` ID in addition to the resource `_id` when performing operations within a project context: `Model.findOne({ _id: id, project: projectId })`. Additionally, standardize error responses to "Internal server error" to avoid leaking implementation details.

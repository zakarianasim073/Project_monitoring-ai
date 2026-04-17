## 2026-04-17 - BOLA in Inventory Controller
**Vulnerability:** Broken Object Level Authorization (BOLA) in `receiveMaterial` and `updatePDRemarks` allowed resource access across projects via ID manipulation.
**Learning:** Using `findById` without checking ownership (project association) is a major security gap in multi-tenant systems.
**Prevention:** Always scope lookups by parent identifiers (e.g., `projectId`) using `Model.findOne({ _id: id, project: projectId })`.

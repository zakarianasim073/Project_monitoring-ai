## 2026-05-22 - BOLA and Information Leakage in inventoryController
**Vulnerability:** Broken Object Level Authorization (BOLA) in `receiveMaterial` and `updatePDRemarks` allowed cross-project resource modification via ID manipulation. Additionally, `error.message` was being leaked in 500 responses.
**Learning:** Relying on `findById(id)` without checking the ownership (e.g., `project: projectId`) is a common source of BOLA. Exposing internal error messages provides attackers with implementation details that can facilitate further attacks.
**Prevention:** Always scope sub-resource lookups to their parent entity (e.g., `findOne({ _id: id, project: projectId })`). Use generic error messages for client-side responses and log detailed errors internally.

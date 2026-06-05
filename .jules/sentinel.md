## 2026-06-05 - BOLA and Information Leakage in Inventory Controller
**Vulnerability:** Broken Object Level Authorization (BOLA) in `inventoryController.ts` where `Material`, `SubContractor`, and `Bill` were accessed via `findById(id)` without verifying they belong to the `projectId` provided in the URL. Additionally, information leakage via verbose 500 error messages.
**Learning:** Standard `findById` lookups are insufficient in multi-project architectures as they allow cross-project resource manipulation if an ID is known.
**Prevention:** Always scope resource lookups to the parent entity (e.g., `Model.findOne({ _id: id, project: projectId })`) and use generic error responses for production-ready backends.

## 2026-05-18 - BOLA and Information Leakage in Inventory Controller
**Vulnerability:** Broken Object Level Authorization (BOLA) and Information Leakage via error messages in `inventoryController.ts`.
**Learning:** Sub-resources like Materials, SubContractors, and Bills were being fetched using `findById(id)` without verifying they belonged to the `projectId` provided in the request parameters. Additionally, returning `error.message` in 500 responses exposed internal implementation details.
**Prevention:** Always scope sub-resource queries with the parent project ID (e.g., `findOne({ _id: id, project: projectId })`) and use generic error messages for production responses while logging the actual error for internal monitoring.

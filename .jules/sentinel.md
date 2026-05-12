## 2026-05-12 - Recurrent BOLA and Mass Assignment in Project Sub-resources
**Vulnerability:** Scoped lookups (e.g., Materials, Documents) frequently lacked `projectId` validation in `findById` calls, and new resource creation used insecure spread operators (`...req.body`).
**Learning:** In a multi-tenant or project-based architecture, relying solely on global IDs for sub-resources allows cross-project data access (BOLA) if the relationship isn't enforced in every query.
**Prevention:** Standardize on `Model.findOne({ _id: id, project: projectId })` for all sub-resource access and use explicit field whitelisting for all POST/PATCH operations.

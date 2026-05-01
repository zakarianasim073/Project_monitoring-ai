## 2026-05-20 - Mass Assignment in Document Uploads
**Vulnerability:** The `POST /:projectId/documents` route was using the spread operator (`...req.body`) to initialize the `ProjectDocument` model, allowing attackers to potentially overwrite internal fields like `project` or inject unexpected data.
**Learning:** High-frequency routes and those dealing with document uploads are prone to recurring regressions where explicit whitelisting is replaced by permissive spread operators for convenience.
**Prevention:** Always use explicit field whitelisting when creating or updating Mongoose models from request bodies, especially in routes that handle file or document metadata.

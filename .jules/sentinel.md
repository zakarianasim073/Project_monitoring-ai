## 2026-03-28 - Fix IDOR and information leakage in inventoryController
**Vulnerability:** Insecure Direct Object Reference (IDOR) and information leakage through error messages.
**Learning:** Controller methods used `findById(id)` without scoping to the `projectId` from request params, allowing cross-project access. Also, `error.message` was directly returned to the client.
**Prevention:** Always use `findOne({ _id: id, project: projectId })` for scoped entity lookups and return generic error messages while logging details to the console.


## 2026-04-13 - Scoped Lookups for BOLA/IDOR Prevention
**Vulnerability:** Sub-resources (Materials, BOQItems, SubContractors, Bills) were being fetched by ID only (`findById`) in controllers, allowing cross-project data access if an attacker knew or guessed an ID.
**Learning:** In multi-tenant or project-based architectures, relying on global IDs for sub-resource access is a high-risk pattern. The application assumed that if a user has access to a project, any ID they provide in a sub-resource request belongs to that project.
**Prevention:** Always scope sub-resource lookups using both the resource ID and the parent project ID: `Model.findOne({ _id: resourceId, project: projectId })`. Add "SECURITY:" comments to these lookups to prevent regressions during future refactoring.

## 2026-04-14 - Scoped Lookups for IDOR Prevention
**Vulnerability:** Insecure Direct Object Reference (IDOR) / Broken Object Level Authorization (BOLA) in sub-resource lookups.
**Learning:** Even with project-level middleware (`requireProjectRole`), endpoints that perform operations on sub-resources (Materials, BOQItems, etc.) using only their `_id` remain vulnerable to IDOR if the sub-resource is not explicitly scoped to the `projectId`. An attacker could bypass project boundaries by providing an ID from a different project.
**Prevention:** Always scope sub-resource lookups using both the resource ID and the parent `projectId`: `Model.findOne({ _id: resourceId, project: projectId })`.

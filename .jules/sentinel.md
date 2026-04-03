## 2026-04-03 - [Fix BOLA/IDOR in project resource lookups]
**Vulnerability:** Broken Object Level Authorization (BOLA) / Insecure Direct Object Reference (IDOR).
**Learning:** Controllers were using `findById(id)` for sub-resources (Materials, BOQItems, etc.) without verifying that the resource actually belongs to the `projectId` provided in the URL. An authenticated user could potentially modify resources in other projects by guessing their IDs.
**Prevention:** Always scope sub-resource lookups by both their unique `_id` and the parent `projectId` (e.g., `Model.findOne({ _id: id, project: projectId })`).

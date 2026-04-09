## 2025-05-14 - Scoping Sub-resource Lookups by Project ID
**Vulnerability:** Insecure Direct Object Reference (IDOR) / Broken Object Level Authorization (BOLA).
**Learning:** Controller actions often looked up sub-resources (like `BOQItem`, `Material`, `SubContractor`, or `Bill`) using only their `_id`. An authenticated user could potentially access or modify items belonging to projects they were not authorized for by providing an item ID from another project.
**Prevention:** Always scope sub-resource lookups by both the resource ID and the parent `projectId`. Use `Model.findOne({ _id: id, project: projectId })` instead of `Model.findById(id)`. Ensure `projectId` is extracted from the request parameters and validated via middleware.

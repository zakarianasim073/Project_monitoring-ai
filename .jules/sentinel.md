## 2025-05-15 - [BOLA & Mass Assignment Fixes]
**Vulnerability:** Broken Object Level Authorization (BOLA) and Mass Assignment.
**Learning:** Controllers were using `findById` without checking if the resource belonged to the current `projectId`. Document creation was using `...req.body` allowing unauthorized field injection.
**Prevention:** Always scope lookups by `projectId` (e.g., `findOne({ _id, project: projectId })`) and explicitly pick allowed fields from `req.body` for model creation.

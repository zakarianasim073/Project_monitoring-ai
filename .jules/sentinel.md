## 2025-05-15 - [BOLA Prevention in Inventory Controller]
**Vulnerability:** IDOR/BOLA allowed updating materials or PD remarks across projects if the user knew the resource ID.
**Learning:** Resource lookups should always be scoped by both `_id` and `projectId`.
**Prevention:** Always include `project: projectId` in the filter object for any sub-resource lookup or update.

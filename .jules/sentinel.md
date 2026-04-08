## 2025-05-14 - Scoped Lookups for Project Sub-resources
**Vulnerability:** Broken Object Level Authorization (BOLA/IDOR) in inventory, DPR, and costing controllers.
**Learning:** Sub-resources (Materials, BOQItems, SubContractors) were fetched using only their `_id`, allowing a user with access to ONE project to manipulate resources in ANY project if they knew the ID.
**Prevention:** Always scope database lookups for project-linked resources using both `_id` and `projectId`. Added "SECURITY:" comments to relevant controller logic to prevent accidental removal of these filters during future optimizations.

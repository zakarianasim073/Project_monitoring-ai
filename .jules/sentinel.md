# Sentinel Journal - Critical Security Learnings

This journal records critical security learnings and patterns discovered during the development and maintenance of the BuildTrack project.

## 2026-06-02 - BOLA and Information Leakage in Inventory Management
**Vulnerability:** Broken Object Level Authorization (BOLA) and Information Leakage in `inventoryController.ts` and `projects.ts`.
**Learning:** Resource lookups for `Material`, `SubContractor`, and `Bill` were only using the record's `_id`, allowing any authenticated user to potentially modify resources of other projects if they knew the ID. Additionally, detailed error messages were being leaked to the client.
**Prevention:** Always scope lookups to both `_id` and `projectId`. Use generic 500 error responses for production-facing APIs while logging details internally.

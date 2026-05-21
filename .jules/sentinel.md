# Sentinel Security Journal

## 2025-03-24 - Initial Security Audit and Hardening
**Vulnerability:** Broken Object Level Authorization (BOLA), Mass Assignment, and Information Leakage.
**Learning:** Sub-resources like Materials, BOQItems, and Bills were being accessed by ID without verifying they belonged to the requested project. Additionally, internal error messages were being leaked to the client, and document creation allowed mass assignment.
**Prevention:** Always scope sub-resource lookups to the `projectId`. Whitelist fields for object creation. Use generic error messages for 500 status codes while logging actual errors server-side.

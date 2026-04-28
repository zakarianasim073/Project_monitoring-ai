# Sentinel Journal - Security Learnings

## 2026-05-18 - BOLA Protection in inventoryController
**Vulnerability:** BOLA (Broken Object Level Authorization) in inventory management.
**Learning:** Replacing `findById` with `findOne({ _id: id, project: projectId })` ensures that users can only access materials belonging to their project.
**Prevention:** Always scope resource lookups by project ID when available in the request.

## 2026-05-19 - Mass Assignment Protection in Document Uploads
**Vulnerability:** Mass assignment in document upload route.
**Learning:** Explicitly whitelisting fields instead of using spread operator `...req.body` prevents attackers from setting internal fields.
**Prevention:** Use a whitelist of allowed fields for all POST/PUT operations.

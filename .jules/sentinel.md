## 2026-04-03 - [Fix BOLA/IDOR in project resource lookups]
**Vulnerability:** Broken Object Level Authorization (BOLA) / Insecure Direct Object Reference (IDOR).
**Learning:** Controllers were using `findById(id)` for sub-resources (Materials, BOQItems, etc.) without verifying that the resource actually belongs to the `projectId` provided in the URL. An authenticated user could potentially modify resources in other projects by guessing their IDs.
**Prevention:** Always scope sub-resource lookups by both their unique `_id` and the parent `projectId` (e.g., `Model.findOne({ _id: id, project: projectId })`).

## 2026-04-03 - [Handling special characters in MONGO_URI]
**Vulnerability:** EBANDNAME (SRV Lookup failure) / Information disclosure.
**Learning:** Special characters (like `@`, `>`, `<`) in MongoDB passwords can break SRV lookup if not URL-encoded. This can cause the driver to misparse the host and leak password fragments in logs when connection fails.
**Prevention:** Always URL-encode the password segment of the `MONGO_URI`. This project now automates this via a `safeEncode` helper in `backend/src/config/db.ts`.

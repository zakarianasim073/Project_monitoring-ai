## 2026-03-27 - Hardcoded MongoDB URI and JWT Secret
**Vulnerability:** Found hardcoded MongoDB credentials and a JWT secret in `backend/.env.example`.
**Learning:** Devs often use `.env.example` not just as a template but as a place to store "default" or "test" credentials, which can accidentally leak into production or be used by unauthorized parties.
**Prevention:** Always use placeholders in `.env.example` and ensure `dotenv` is configured to fail or warn if required keys are missing from the actual `.env` file.

## 2026-03-27 - IDOR in Project Sub-resources
**Vulnerability:** Multiple endpoints (DPR creation, Cost Analysis, PD Remarks) were using `findById` for sub-resources (BOQ items, materials, etc.) using IDs provided in the request, without verifying that these resources belonged to the `projectId` the user was authorized for.
**Learning:** Even when using authorization middleware for the main resource (Project), sub-resources must still be explicitly scoped to that main resource in every query to prevent IDOR/BOLA.
**Prevention:** Always use `findOne({ _id: subResourceId, project: projectId })` instead of `findById(subResourceId)` when the `projectId` has been verified by middleware.

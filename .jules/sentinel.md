# Sentinel Journal 🛡️

Critical security learnings for BuildTrack AI.

## 2026-05-31 - Initial Security Hardening
**Vulnerability:** Multiple BOLA risks and Information Leakage via verbose error messages.
**Learning:** Controllers was using `findById` for sub-resources without scoping to `projectId`, and routes were leaking `error.message` in 500 responses.
**Prevention:** Always use `findOne({ _id: id, project: projectId })` for sub-resource lookups and return generic 'Internal server error' to clients.

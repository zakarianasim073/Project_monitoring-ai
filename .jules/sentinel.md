## 2026-07-29 - [BOLA, Mass Assignment, Info Leakage]
**Vulnerability:** Regressions in project-scoped routes. AI insights lacked role checks (BOLA), document creation used `...req.body` (Mass Assignment), and 500 errors leaked raw error messages (Information Leakage).
**Learning:** These vulnerabilities frequently regress in this codebase, possibly due to copy-pasting code or refactors that prioritize functionality over security.
**Prevention:** Always verify that every project-scoped route uses `requireProjectRole` and explicit field whitelisting. Standardize on generic 'Internal server error' responses across all controllers and routes.

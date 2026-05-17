## 2025-03-12 - Information Leakage and BOLA/Mass Assignment Regressions
**Vulnerability:** Persistent Information Leakage (exposing `error.message` in 500 responses), missing BOLA protection on AI insight routes, and Mass Assignment risk in document creation.
**Learning:** Security fixes in project-scoped routes and controllers are subject to frequent regressions in this codebase. Standardizing on generic 'Internal server error' responses and explicit field whitelisting is necessary across all controllers.
**Prevention:** Always verify error handling and authorization middleware during routine work. Use `grep` to hunt for `error.message` patterns before PR submission.

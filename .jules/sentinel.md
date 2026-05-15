## 2026-05-14 - Information Leakage and BOLA Regressions
**Vulnerability:** Raw error messages (`error.message`) were being returned in 500 responses, and the `requireProjectRole` middleware was missing from the AI insights endpoint. Mass assignment was also possible on the document upload route.
**Learning:** Security fixes in this codebase are highly prone to regressions, likely due to rapid feature development or lack of automated security tests.
**Prevention:** Always verify security controls (middleware, error handling, whitelisting) using `grep` or manual inspection before submitting changes. Implement automated security regression tests if possible.

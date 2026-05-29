## 2026-05-29 - Remediating BOLA and Auth Regressions
**Vulnerability:** Broken Object Level Authorization (BOLA) in inventory and DPR controllers, and missing authorization on AI insights endpoint.
**Learning:** High-performance patterns and security scoping are prone to regression during maintenance if not strictly enforced by tests.
**Prevention:** Always scope sub-resource lookups to the `projectId` from the validated route parameters. Use generic error messages to prevent Information Leakage.

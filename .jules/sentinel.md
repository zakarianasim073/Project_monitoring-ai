## 2026-04-12 - Systemic IDOR Vulnerabilities in Project Controllers
**Vulnerability:** Systemic Insecure Direct Object Reference (IDOR/BOLA) where sub-resources (Materials, BOQItems, Bills, SubContractors) were fetched by ID without verifying their association with the parent Project.
**Learning:** Even with project-level middleware, individual resource lookups in controllers often revert to simple `findById` calls, bypassing logical ownership checks.
**Prevention:** Always scope sub-resource lookups using `findOne({ _id: id, project: projectId })` and use `Project.exists()` for efficient existence validation.

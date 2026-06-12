## 2026-06-12 - BOLA and Information Leakage regressions in inventoryController.ts
**Vulnerability:** Broken Object Level Authorization (BOLA) and Information Leakage. Lookups for sub-resources (Material, SubContractor, Bill) were not scoped to the project ID, and verbose error messages were leaking stack traces.
**Learning:** Security optimizations are prone to regressions if subsequent changes revert to standard 'findById' or verbose 'try-catch' patterns without considering the security context.
**Prevention:** Always use scoped lookups (e.g., `findOne({ _id: id, project: projectId })`) for sub-resources and standardize on generic error messages in catch blocks. Document these as "SECURITY:" requirements in the code.

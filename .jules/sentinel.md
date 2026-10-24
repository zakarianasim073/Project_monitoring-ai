## 2025-03-25 - [BOLA Remediation Synchronization]
**Vulnerability:** Broken Object Level Authorization (BOLA).
**Learning:** Attempting to remediate BOLA by shifting parameters from the request body to route parameters (e.g., `projectId`) requires synchronized updates to the Express router definitions. Failing to do so results in `undefined` parameters and broken logic.
**Prevention:** Always verify that route definitions match the expected parameters in the controller, especially when tightening security boundaries. Start with smaller, focused security enhancements to ensure stability.

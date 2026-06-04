## 2026-06-04 - Broken Function Level Authorization on AI Insights
**Vulnerability:** The AI insights endpoint `/:projectId/ai/insights` was only protected by authentication (`protect`), but lacked authorization checks to verify if the authenticated user belonged to the project and had an appropriate role.
**Learning:** Endpoints added during rapid feature development (like AI enhancements) often miss standard middleware layers if they aren't part of a strictly enforced template.
**Prevention:** Always verify that every route including a `:projectId` parameter utilizes the `requireProjectRole` middleware to enforce RBAC.

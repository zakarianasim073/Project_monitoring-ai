## 2025-05-14 - Broken Object Level Authorization (BOLA) in AI Insights
**Vulnerability:** The AI insights route was protected by authentication but lacked project-specific authorization, allowing any authenticated user to access insights for any project ID.
**Learning:** Routes added later (like AI features) are more likely to miss standard middleware patterns compared to core CRUD routes.
**Prevention:** Always apply `requireProjectRole` to any route containing a `:projectId` parameter to enforce multi-tenancy boundaries.

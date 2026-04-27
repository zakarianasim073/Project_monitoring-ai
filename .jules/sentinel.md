## 2025-05-15 - Registration Input Validation
**Vulnerability:** Lack of input validation on the `/register` endpoint allowed for potentially invalid or malicious data (e.g., extremely short passwords, malformed emails) to be persisted in the database.
**Learning:** Even if a frontend performs validation, the backend must never trust client-provided data and should implement its own validation layer.
**Prevention:** Implement server-side validation for all user-facing endpoints using a library like Zod or manual checks.

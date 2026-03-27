## 2026-03-27 - Hardcoded MongoDB URI and JWT Secret
**Vulnerability:** Found hardcoded MongoDB credentials and a JWT secret in `backend/.env.example`.
**Learning:** Devs often use `.env.example` not just as a template but as a place to store "default" or "test" credentials, which can accidentally leak into production or be used by unauthorized parties.
**Prevention:** Always use placeholders in `.env.example` and ensure `dotenv` is configured to fail or warn if required keys are missing from the actual `.env` file.

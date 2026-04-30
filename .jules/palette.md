## 2026-04-30 - Login Accessibility & Quick Login
**Learning:** Icon-only buttons (like password toggles) must have ARIA labels, and auxiliary buttons (like Quick Login) should use `type="button"` to avoid accidental form submission.
**Action:** Always include `aria-label` and `type="button"` for interactive non-submit elements.

## 2025-05-14 - Interactive Demo Credentials
**Learning:** Providing demo credentials as clickable buttons instead of plain text significantly reduces friction for first-time users and manual testers.
**Action:** Always wrap demo credentials in buttons that auto-fill the login form when clicked.

## 2025-05-14 - Password Visibility Toggle Accessibility
**Learning:** Icon-only password visibility toggles MUST have descriptive `aria-label` attributes that update based on the state (Show/Hide) to be usable by screen reader users.
**Action:** Implement password toggles with dynamic `aria-label` and `type="button"` to avoid accidental form submission.
